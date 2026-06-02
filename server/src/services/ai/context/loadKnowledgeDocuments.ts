import { listActiveKnowledgeBaseForAi } from "../../knowledge/knowledgeBaseService";
import type { AssistantKnowledgeDocumentSnippet } from "../types";

const MAX_DOC_CHARS = 4000;

export async function loadKnowledgeDocuments(): Promise<
  AssistantKnowledgeDocumentSnippet[]
> {
  const rows = await listActiveKnowledgeBaseForAi();
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    sourceType: row.sourceType,
    content:
      row.content.length > MAX_DOC_CHARS
        ? `${row.content.slice(0, MAX_DOC_CHARS)}…`
        : row.content,
  }));
}
