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

export type ChatUIMessage = UIMessage<
  never,
  {
    sources: RetrievedSource[];
    scores: ChunkScoreData[];
  }
>;
