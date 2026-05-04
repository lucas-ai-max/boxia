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

// Categorias e flags são definidas pelo user (tabelas boxia_user_categories / boxia_user_flags).
// Cada uma tem slug (estável, usado no banco e no prompt) + label (humano) + description (orienta a IA).
export interface CategoryDef { slug: string; label: string; description: string | null }
export interface FlagDef { slug: string; label: string; description: string | null }

export interface ClassifiedCaixinha {
  score: number;
  // null quando o user não tem nenhuma categoria definida ainda.
  category: string | null;
  // Map slug → boolean. Só inclui slugs que vieram na lista do user.
  flags: Record<string, boolean>;
}

export interface ClassifyInput {
  brandDna: string;
  pergunta: string;
  contextoVisual?: string;
  categories: CategoryDef[];
  flags: FlagDef[];
}

export interface GenerationContext {
  brandDna: string;
  brandExamples: string[];
  ragExamples: { question: string; answer: string }[];
  recentApproved: string[];
  pergunta: string;
  category: string | null;
  modifier?: string;
  maxChars?: number;
  promptQuestion?: string;
  autorNome?: string;
}

export interface LLMProvider {
  extractFromVideo(absolutePath: string, mimeType: string, promptQuestion?: string): Promise<ExtractionResult>;
  extractFromImages(images: { absolutePath: string; mimeType: string }[], promptQuestion?: string): Promise<ExtractionResult>;
  extractHistoricalFromImages(images: { absolutePath: string; mimeType: string }[]): Promise<{ question: string; answer: string }[]>;
  classify(input: ClassifyInput): Promise<ClassifiedCaixinha>;
  generate(ctx: GenerationContext): Promise<string[]>;
  embed(text: string): Promise<number[]>;
  modelVersion(): string;
}
