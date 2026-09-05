import PageHeader from "@/app/components/PageHeader";
import KnowledgeBaseForm from "../KnowledgeBaseForm";
import { createEntry } from "../actions";

export default function NewKnowledgeBaseEntryPage() {
  return (
    <>
      <PageHeader
        title="New FAQ entry"
        subtitle="Add a question the chatbot should be able to answer"
      />
      <div className="p-8">
        <KnowledgeBaseForm action={createEntry} />
      </div>
    </>
  );
}
