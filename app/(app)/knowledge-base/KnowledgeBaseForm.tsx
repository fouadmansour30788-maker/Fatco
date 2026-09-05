import Link from "next/link";

type EntryValues = {
  id?: string;
  question?: string;
  questionAr?: string | null;
  answer?: string;
  answerAr?: string | null;
  keywords?: string | null;
  active?: boolean;
};

export default function KnowledgeBaseForm({
  action,
  values = {},
  isEdit = false,
}: {
  action: (formData: FormData) => void;
  values?: EntryValues;
  isEdit?: boolean;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="card space-y-4 p-6">
        <div>
          <label className="label">Question *</label>
          <input
            name="question"
            required
            defaultValue={values.question ?? ""}
            className="input"
            placeholder="e.g. Do you offer home delivery?"
          />
        </div>
        <div>
          <label className="label">Question (Arabic)</label>
          <input
            name="questionAr"
            dir="rtl"
            defaultValue={values.questionAr ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Answer *</label>
          <textarea
            name="answer"
            required
            rows={3}
            defaultValue={values.answer ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Answer (Arabic)</label>
          <textarea
            name="answerAr"
            dir="rtl"
            rows={3}
            defaultValue={values.answerAr ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Extra match keywords</label>
          <input
            name="keywords"
            defaultValue={values.keywords ?? ""}
            className="input"
            placeholder="comma-separated words that should also trigger this answer, e.g. delivery, shipping, توصيل"
          />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="active" defaultChecked={values.active ?? true} />
            Active
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-brand">
          {isEdit ? "Save changes" : "Add entry"}
        </button>
        <Link href="/knowledge-base" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
