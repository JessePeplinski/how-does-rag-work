import { UIMessage } from 'ai';

export interface RetrievedSource {
  title: string;
  sourceFile: string;
  similarity: number;
  text: string;
}

export interface ChunkScoreData {
  title: string;
  sourceFile: string;
  similarity: number;
  selected: boolean;
}

export interface QueryTermData {
  /** The original word as it appeared in the query */
  original: string;
  /** Normalized (lowercased) form */
  normalized: string;
  /** Importance weight (0-1, based on IDF or frequency) */
  weight: number;
  /** Which source indices (0-based) contain this term */
  foundInSources: number[];
}

export type ChatUIMessage = UIMessage<
  never,
  {
    sources: RetrievedSource[];
    scores: ChunkScoreData[];
    queryTerms: QueryTermData[];
  }
>;
