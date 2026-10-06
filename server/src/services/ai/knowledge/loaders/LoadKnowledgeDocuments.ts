import { listActiveKnowledgeBaseForAi } from "../../../knowledge/knowledgeBaseService";
import type { AssistantKnowledgeDocumentSnippet } from "../../types";
import { excerptRelevant, extractKeywords, rankByScore, scoreFields } from "../relevance";

const MAX_DOC_CHARS = 4000;
// Hard ceiling across all documents so a large knowledge base cannot blow up the prompt.
const MAX_TOTAL_DOC_CHARS = 8000;
// Rank across more than we keep, so older-but-relevant documents can still win.
const CANDIDATE_DOCS = 20;
const DEFAULT_MAX_DOCS = 3;

export async function loadKnowledgeDocuments(
  message = "",
  maxDocs = DEFAULT_MAX_DOCS,
): Promise<AssistantKnowledgeDocumentSnippet[]> {
  if (maxDocs <= 0) return [];

  const rows = await listActiveKnowledgeBaseForAi(CANDIDATE_DOCS);
  const terms = extractKeywords(message);
  const score = (row: (typeof rows)[number]) =>
    scoreFields(
      [
        { text: row.title, weight: 3 },
        { text: row.content, weight: 1 },
      ],
      terms,
    );

  const matching = rows.filter((row) => score(row) > 0);
  // No keyword hit (or no keywords): keep the newest documents rather than nothing.
  const selected =
    matching.length > 0 ? rankByScore(matching, score, maxDocs) : rows.slice(0, maxDocs);

  const snippets: AssistantKnowledgeDocumentSnippet[] = [];
  let remaining = MAX_TOTAL_DOC_CHARS;
  for (const row of selected) {
    if (remaining <= 0) break;
    const content = excerptRelevant(row.content, terms, Math.min(MAX_DOC_CHARS, remaining));
    snippets.push({
      id: row.id,
      title: row.title,
      sourceType: row.sourceType,
      content,
    });
    remaining -= content.length;
  }

  return snippets;
}
