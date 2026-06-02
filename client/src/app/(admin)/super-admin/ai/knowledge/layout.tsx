import { Suspense } from "react";

export default function AiKnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
