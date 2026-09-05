import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getChatbotSettings } from "@/lib/chatbotSettings";
import PageHeader from "@/app/components/PageHeader";
import { toggleEntry, deleteEntry, saveChatbotSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  const [entries, settings] = await Promise.all([
    prisma.knowledgeBaseEntry.findMany({ orderBy: { createdAt: "desc" } }),
    getChatbotSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Chatbot & FAQ"
        subtitle="Controls the rule-based chatbot in the customer portal and WhatsApp — no AI involved, just keyword matching against this content and the database"
        action={{ href: "/knowledge-base/new", label: "+ New FAQ entry" }}
      />
      <div className="space-y-8 p-8">
        <form action={saveChatbotSettingsAction} className="card max-w-2xl space-y-4 p-6">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Greeting &amp; fallback</h3>
            <p className="text-xs text-zinc-500">
              Shown when a customer says hello, or when nothing matches their question.
            </p>
          </div>
          <div>
            <label className="label">Greeting</label>
            <textarea
              name="greeting"
              rows={2}
              defaultValue={settings.greeting}
              className="input"
            />
          </div>
          <div>
            <label className="label">Greeting (Arabic)</label>
            <textarea
              name="greetingAr"
              dir="rtl"
              rows={2}
              defaultValue={settings.greetingAr}
              className="input"
            />
          </div>
          <div>
            <label className="label">Fallback (nothing matched)</label>
            <textarea
              name="fallbackMessage"
              rows={2}
              defaultValue={settings.fallbackMessage}
              className="input"
            />
          </div>
          <div>
            <label className="label">Fallback (Arabic)</label>
            <textarea
              name="fallbackMessageAr"
              dir="rtl"
              rows={2}
              defaultValue={settings.fallbackMessageAr}
              className="input"
            />
          </div>
          <button type="submit" className="btn-brand">
            Save
          </button>
        </form>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            FAQ entries ({entries.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e) => (
              <div key={e.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{e.question}</h3>
                  <span
                    className={`badge shrink-0 ${
                      e.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {e.active ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-zinc-500">{e.answer}</p>
                {e.keywords && (
                  <p className="mt-2 text-xs text-zinc-400">Keywords: {e.keywords}</p>
                )}
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 text-xs">
                  <Link
                    href={`/knowledge-base/${e.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={toggleEntry}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="active" value={String(e.active)} />
                    <button className="text-zinc-500 hover:text-zinc-800">
                      {e.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deleteEntry} className="ms-auto">
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-zinc-400 hover:text-brand">Delete</button>
                  </form>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
                No FAQ entries yet.{" "}
                <Link href="/knowledge-base/new" className="text-brand hover:underline">
                  Add your first one
                </Link>
                .
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
