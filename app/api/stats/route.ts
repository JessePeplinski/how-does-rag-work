import { initializeKnowledgeBase, getKnowledgeBaseStats } from '@/lib/knowledge-base';

export async function GET() {
  await initializeKnowledgeBase();
  return Response.json(getKnowledgeBaseStats());
}
