import { UIMessage } from 'ai';

export interface RetrievedSource {
  title: string;
  sourceFile: string;
  similarity: number;
  text: string;
}

export type ChatUIMessage = UIMessage<
  never,
  {
    sources: RetrievedSource[];
  }
>;
