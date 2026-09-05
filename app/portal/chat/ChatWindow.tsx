"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "./actions";

type Message = { role: "USER" | "ASSISTANT"; content: string };

type ChatText = {
  placeholder: string;
  send: string;
  empty: string;
};

export default function ChatWindow({
  initialMessages,
  t,
}: {
  initialMessages: Message[];
  t: ChatText;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "USER", content: text }]);
    setPending(true);
    try {
      const { reply } = await sendChatMessage(text);
      setMessages((m) => [...m, { role: "ASSISTANT", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ASSISTANT", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card flex h-[70vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-400">{t.empty}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "USER"
                  ? "bg-brand text-white"
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-400">
              …
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-zinc-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          disabled={pending}
          className="input flex-1"
        />
        <button type="submit" disabled={pending || !input.trim()} className="btn-brand">
          {t.send}
        </button>
      </form>
    </div>
  );
}
