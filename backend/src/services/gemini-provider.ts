import fs from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { FileState, GoogleGenAI, Type, createPartFromUri } from '@google/genai';
import { env } from '../config/env.js';
import type {
  ClassifiedCaixinha, ClassifyInput, ExtractionResult, GenerationContext, LLMProvider,
} from './llm-provider.js';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI | null;

  constructor() {
    this.client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;
  }

  modelVersion() {
    return env.GEMINI_MODEL;
  }

  private ensureClient(): GoogleGenAI {
    if (!this.client) {
      const err = new Error(
        'A IA está desconfigurada. Peça ao administrador para configurar a chave de acesso (GEMINI_API_KEY).',
      );
      (err as Error & { statusCode?: number }).statusCode = 503;
      throw err;
    }
    return this.client;
  }

  async extractFromVideo(absolutePath: string, mimeType: string, promptQuestion?: string): Promise<ExtractionResult> {
    const client = this.ensureClient();
    // Vídeos vão pela Files API: o limite de ~20 MB do inlineData estoura facilmente
    // e o erro retorna como `fetch failed` opaco antes de virar HTTP error.
    const file = await uploadAndWaitActive(client, absolutePath, mimeType);
    try {
      const res = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [{
          role: 'user',
          parts: [
            createPartFromUri(file.uri!, file.mimeType ?? mimeType),
            { text: buildExtractPrompt('video', promptQuestion) },
          ],
        }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: extractionSchema(),
        },
      });
      return parseExtraction(res.text ?? '');
    } finally {
      if (file.name) {
        client.files.delete({ name: file.name }).catch(() => { /* best-effort */ });
      }
    }
  }

  async extractFromImages(images: { absolutePath: string; mimeType: string }[], promptQuestion?: string): Promise<ExtractionResult> {
    const client = this.ensureClient();
    const parts = await Promise.all(images.map(async (img) => ({
      inlineData: { mimeType: img.mimeType, data: (await fs.readFile(img.absolutePath)).toString('base64') },
    })));
    const res = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [...parts, { text: buildExtractPrompt('prints', promptQuestion) }],
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionSchema(),
      },
    });
    return parseExtraction(res.text ?? '');
  }

  async extractHistoricalFromImages(images: { absolutePath: string; mimeType: string }[]) {
    const client = this.ensureClient();
    const parts = await Promise.all(images.map(async (img) => ({
      inlineData: { mimeType: img.mimeType, data: (await fs.readFile(img.absolutePath)).toString('base64') },
    })));
    const res = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [...parts, { text: HISTORICAL_EXTRACT_PROMPT }],
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
          },
          required: ['pairs'],
        },
      },
    });
    try {
      const obj = JSON.parse(res.text ?? '{"pairs":[]}');
      return Array.isArray(obj.pairs) ? obj.pairs : [];
    } catch {
      return [];
    }
  }

  async classify(input: ClassifyInput): Promise<ClassifiedCaixinha> {
    const client = this.ensureClient();

    // Sem categorias E sem flags = nada pra IA escolher; pula a chamada.
    if (input.categories.length === 0 && input.flags.length === 0) {
      return { score: 50, category: null, flags: {} };
    }

    const categorySlugs = input.categories.map((c) => c.slug);
    const flagSlugs = input.flags.map((f) => f.slug);
    const prompt = buildClassifyPrompt(input);

    const res = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: classifySchema(categorySlugs, flagSlugs) as never,
      },
    });
    try {
      const obj = JSON.parse(res.text ?? '{}');
      const categorySet = new Set(categorySlugs);
      const flagSet = new Set(flagSlugs);
      // Garante que IA não inventou slugs que não existem no catálogo do user.
      const category = typeof obj.category === 'string' && categorySet.has(obj.category)
        ? obj.category
        : (categorySlugs[0] ?? null);
      const flags: Record<string, boolean> = {};
      if (obj.flags && typeof obj.flags === 'object') {
        for (const slug of flagSlugs) {
          if (obj.flags[slug] === true) flags[slug] = true;
        }
        // ignora qualquer chave que IA inventou fora do flagSet
        void flagSet;
      }
      const score = typeof obj.score === 'number' ? Math.max(0, Math.min(100, Math.round(obj.score))) : 50;
      return { score, category, flags };
    } catch {
      return { score: 50, category: categorySlugs[0] ?? null, flags: {} };
    }
  }

  async generate(ctx: GenerationContext): Promise<string[]> {
    const client = this.ensureClient();
    const prompt = composePrompt(ctx);
    const res = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['suggestions'],
        },
      },
    });
    try {
      const obj = JSON.parse(res.text ?? '{}');
      if (Array.isArray(obj.suggestions) && obj.suggestions.length > 0) {
        return obj.suggestions.slice(0, 3);
      }
      throw new Error('IA retornou resposta vazia');
    } catch (e) {
      throw new Error(`Não consegui gerar respostas agora. Tente de novo em instantes.`);
    }
  }

  async embed(text: string): Promise<number[]> {
    const client = this.ensureClient();
    const res = await client.models.embedContent({
      model: env.GEMINI_EMBED_MODEL,
      contents: text,
      // Forçar 768d para casar com o schema vector(768) no Postgres.
      config: { outputDimensionality: 768 },
    });
    const values = res.embeddings?.[0]?.values;
    if (!values || values.length !== 768) {
      throw new Error('Falha ao indexar resposta para busca semântica.');
    }
    return values;
  }
}

function composePrompt(ctx: GenerationContext): string {
  const lines: string[] = [];
  lines.push(
    `Você escreve respostas para caixinhas de perguntas (Q&A stickers) do Instagram, IMITANDO o tom autêntico do criador. ` +
    `Idioma: pt-BR. Máximo: ${ctx.maxChars ?? 280} caracteres. ` +
    `Soe como uma pessoa real, não como uma IA.`,
  );
  lines.push('');
  if (ctx.brandDna) lines.push(`### Tom de voz do criador\n${ctx.brandDna}`);
  if (ctx.brandExamples.length) {
    lines.push(`### Exemplos do tom\n${ctx.brandExamples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`);
  }
  if (ctx.ragExamples.length) {
    lines.push('### Respostas REAIS já dadas pelo criador (PRIORIDADE — esse é o tom autêntico)');
    ctx.ragExamples.forEach((p, i) => {
      lines.push(`Exemplo ${i + 1}:\n  Pergunta: ${p.question}\n  Resposta: ${p.answer}`);
    });
  }
  if (ctx.recentApproved.length) {
    lines.push(`### Respostas recentes que o criador aprovou no app\n${ctx.recentApproved.map((e, i) => `${i + 1}. ${e}`).join('\n')}`);
  }
  // Contexto da caixinha — agora com nome do seguidor e a pergunta original do criador, se houver.
  lines.push('### Contexto da caixinha');
  if (ctx.promptQuestion) {
    lines.push(`O criador postou esta pergunta na caixinha: "${ctx.promptQuestion}"`);
    lines.push(`As mensagens abaixo são RESPOSTAS dos seguidores a essa pergunta. O criador agora quer responder DE VOLTA pra cada um.`);
  }
  if (ctx.autorNome) {
    lines.push(`Seguidor: ${ctx.autorNome}`);
    lines.push(`Mensagem do seguidor: "${ctx.pergunta}"`);
    lines.push(`Quando fizer sentido, chame a pessoa pelo primeiro nome de forma natural.`);
  } else {
    lines.push(`Mensagem do seguidor: "${ctx.pergunta}"`);
  }
  if (ctx.category) lines.push(`Tipo: ${ctx.category}`);
  if (ctx.modifier) lines.push(`### Ajuste pedido\n${ctx.modifier}`);
  lines.push('');
  lines.push('Gere 2 a 3 sugestões DIFERENTES (variando estilo e tamanho). Retorne JSON: { "suggestions": ["...", "...", "..."] }.');
  return lines.join('\n');
}

function buildExtractPrompt(source: 'video' | 'prints', promptQuestion?: string): string {
  const intro = source === 'video'
    ? `Você está vendo uma gravação de tela do Instagram navegando por uma caixinha de perguntas (Q&A sticker).`
    : `Você recebe imagens (prints) de caixinhas de perguntas do Instagram.`;
  const ctx = promptQuestion
    ? `\n\nCONTEXTO IMPORTANTE: o criador postou esta pergunta na caixinha:\n  "${promptQuestion}"\nAs mensagens visíveis são RESPOSTAS dos seguidores a essa pergunta.`
    : '';
  const fields = source === 'video'
    ? `pergunta (texto literal da mensagem do seguidor), autorNome (nome ou @handle do seguidor exatamente como aparece — NÃO ANONIMIZE), contextoVisual (emojis, stickers), timestampSeconds (quando aparece) e confidence (0-1).`
    : `pergunta (texto literal da mensagem), autorNome (nome ou @handle do seguidor exatamente como aparece — NÃO ANONIMIZE), contextoVisual (emojis), printIndex (número da imagem) e confidence (0-1).`;
  return (
    `${intro}${ctx}\n\n` +
    `Extraia TODAS as caixinhas que aparecem, na ordem em que aparecem. ` +
    `IMPORTANTE: NÃO REMOVA DUPLICATAS. Se duas pessoas mandaram a mesma resposta, ou se a mesma pessoa aparece duas vezes, ` +
    `retorne TODOS os itens — cada caixinha visível vira um item, sem exceção.\n\n` +
    `Para cada caixinha, retorne ${fields}\n\n` +
    `Mantenha o nome do autor visível (ex.: "Camila Silva", "@joao_oliveira"). Se o nome não estiver visível na imagem, ` +
    `deixe autorNome em branco. Retorne JSON estrito conforme schema.`
  );
}

const HISTORICAL_EXTRACT_PROMPT =
  `Você recebe prints de caixinhas do Instagram que JÁ FORAM RESPONDIDAS pelo criador. ` +
  `Em cada print há a PERGUNTA do seguidor e a RESPOSTA do criador. Extraia o par {question, answer}. ` +
  `Retorne JSON: { "pairs": [{ "question": "...", "answer": "..." }, ...] }. ` +
  `Se um print não tiver resposta visível, omita-o.`;

function buildClassifyPrompt(input: ClassifyInput): string {
  const lines: string[] = [];
  lines.push(`Você está classificando uma caixinha de pergunta do Instagram pra ajudar o criador a priorizar respostas.`);
  lines.push(``);
  lines.push(`Tom de voz do criador:\n${input.brandDna || '(não fornecido)'}`);
  lines.push(``);
  lines.push(`Caixinha:\n"${input.pergunta}"`);
  if (input.contextoVisual) lines.push(`Contexto visual: ${input.contextoVisual}`);
  lines.push(``);

  if (input.categories.length > 0) {
    lines.push(`### Categorias (escolha EXATAMENTE UMA — use o slug)`);
    for (const c of input.categories) {
      const desc = c.description ? ` — ${c.description}` : '';
      lines.push(`- "${c.slug}" (${c.label})${desc}`);
    }
  }
  if (input.flags.length > 0) {
    lines.push(``);
    lines.push(`### Flags (marque true só pras que se aplicam — pode ser nenhuma, uma ou várias)`);
    for (const f of input.flags) {
      const desc = f.description ? ` — ${f.description}` : '';
      lines.push(`- "${f.slug}" (${f.label})${desc}`);
    }
  }
  lines.push(``);
  lines.push(`Retorne JSON com: score (0-100, importância pra responder)`);
  if (input.categories.length > 0) lines.push(`+ category (slug exato da lista acima)`);
  if (input.flags.length > 0) lines.push(`+ flags (objeto { "slug": true } só pras flags que se aplicam)`);
  lines.push(`Critérios pro score: alinhamento com o tom, potencial de engajamento, especificidade.`);
  return lines.join('\n');
}

function extractionSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      totalCaixinhas: { type: Type.INTEGER },
      caixinhas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pergunta: { type: Type.STRING },
            autorNome: { type: Type.STRING },
            contextoVisual: { type: Type.STRING },
            timestampSeconds: { type: Type.INTEGER },
            printIndex: { type: Type.INTEGER },
            confidence: { type: Type.NUMBER },
          },
          required: ['pergunta', 'confidence'],
        },
      },
    },
    required: ['totalCaixinhas', 'caixinhas'],
  };
}

function classifySchema(categorySlugs: string[], flagSlugs: string[]) {
  const properties: Record<string, unknown> = {
    score: { type: Type.INTEGER },
  };
  const required: string[] = ['score'];

  if (categorySlugs.length > 0) {
    properties.category = { type: Type.STRING, enum: categorySlugs };
    required.push('category');
  }

  if (flagSlugs.length > 0) {
    const flagProps: Record<string, unknown> = {};
    for (const slug of flagSlugs) {
      flagProps[slug] = { type: Type.BOOLEAN };
    }
    properties.flags = {
      type: Type.OBJECT,
      properties: flagProps,
    };
  }

  return {
    type: Type.OBJECT,
    properties,
    required,
  };
}

async function uploadAndWaitActive(client: GoogleGenAI, absolutePath: string, mimeType: string) {
  const uploaded = await client.files.upload({ file: absolutePath, config: { mimeType } });
  if (!uploaded.name) throw new Error('Upload do vídeo não retornou identificador.');

  const deadline = Date.now() + 5 * 60_000;
  let current = uploaded;
  while (current.state === FileState.PROCESSING) {
    if (Date.now() > deadline) {
      client.files.delete({ name: current.name! }).catch(() => {});
      throw new Error('Tempo esgotado processando o vídeo na IA.');
    }
    await sleep(2000);
    current = await client.files.get({ name: current.name! });
  }
  if (current.state !== FileState.ACTIVE || !current.uri) {
    const detail = current.error?.message ?? current.state ?? 'estado desconhecido';
    throw new Error(`Falha ao preparar o vídeo na IA: ${detail}`);
  }
  return current;
}

function parseExtraction(text: string): ExtractionResult {
  try {
    const obj = JSON.parse(text);
    return {
      totalCaixinhas: Number(obj.totalCaixinhas ?? obj.caixinhas?.length ?? 0),
      caixinhas: Array.isArray(obj.caixinhas) ? obj.caixinhas : [],
    };
  } catch {
    return { totalCaixinhas: 0, caixinhas: [] };
  }
}

export const llm: LLMProvider = new GeminiProvider();
