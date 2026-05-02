export interface ExtractedCaixinha {
  pergunta: string;
  contextoVisual?: string;
  autorNome?: string;
  timestampSeconds?: number;
  printIndex?: number;
  confidence: number;
}

export interface ExtractionResult {
  totalCaixinhas: number;
  caixinhas: ExtractedCaixinha[];
}

export interface ClassifiedCaixinha {
  score: number;
  category:
    | 'duvida-produto' | 'pedido-conteudo' | 'elogio' | 'feedback-construtivo'
    | 'oportunidade-lead' | 'pergunta-pessoal' | 'ruido' | 'sensivel';
  flags: { urgente?: boolean; sensivel?: boolean; repetida?: boolean };
}

export interface GenerationContext {
  brandDna: string;
  brandExamples: string[];
  ragExamples: { question: string; answer: string }[];
  recentApproved: string[];
  pergunta: string;
  category: string;
  modifier?: string;
  maxChars?: number;
  promptQuestion?: string;
  autorNome?: string;
}

export interface LLMProvider {
  extractFromVideo(absolutePath: string, mimeType: string, promptQuestion?: string): Promise<ExtractionResult>;
  extractFromImages(images: { absolutePath: string; mimeType: string }[], promptQuestion?: string): Promise<ExtractionResult>;
  extractHistoricalFromImages(images: { absolutePath: string; mimeType: string }[]): Promise<{ question: string; answer: string }[]>;
  classify(input: { brandDna: string; pergunta: string; contextoVisual?: string }): Promise<ClassifiedCaixinha>;
  generate(ctx: GenerationContext): Promise<string[]>;
  embed(text: string): Promise<number[]>;
  modelVersion(): string;
}
