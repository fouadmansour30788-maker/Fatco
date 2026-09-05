import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/app/components/PageHeader";
import KnowledgeBaseForm from "../KnowledgeBaseForm";
import { updateEntry } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditKnowledgeBaseEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await prisma.knowledgeBaseEntry.findUnique({ where: { id } });
  if (!entry) notFound();

  return (
    <>
      <PageHeader title="Edit FAQ entry" subtitle="Update this chatbot answer" />
      <div className="p-8">
        <KnowledgeBaseForm action={updateEntry} values={entry} isEdit />
      </div>
    </>
  );
}
