"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Check } from "lucide-react";
import { ChatMessage } from "@/lib/types";

/** The agent now answers general questions too (comparisons, tables) as well as build changes; render its markdown instead of literal text. */
function AssistantText({ content }: { content: string }) {
  return (
    <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border/60 bg-muted/60 px-2.5 py-1.5 text-left font-medium text-muted-foreground">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border/40 px-2.5 py-1.5 align-top">{children}</td>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

/** Renders the agent's real, live tool activity for this turn (see `workspace.tsx`'s `onEvent` handler), not a fixed timer. */
function ActivityLog({ log }: { log: string[] }) {
  if (log.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-4 w-4 items-center justify-center">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
        </span>
        <span className="text-foreground">Thinking...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {log.map((label, i) => {
        const done = i < log.length - 1;
        return (
          <motion.div
            key={`${i}-${label}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className={
                done
                  ? "flex h-4 w-4 items-center justify-center rounded-full bg-success/20 text-success"
                  : "flex h-4 w-4 items-center justify-center"
              }
            >
              {done ? <Check size={11} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />}
            </span>
            <span className={done ? "text-muted-foreground" : "text-foreground"}>{label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ConversationPanel({
  messages,
  loading,
  thinking,
  activityLog,
  onSend,
  disabled,
}: {
  messages: ChatMessage[];
  loading: boolean;
  thinking?: boolean;
  activityLog: string[];
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <div className="relative flex h-full flex-col">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 z-0"
          >
            <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover opacity-[0.14]" src="/media/ai-data-flow.mp4" />
            <div className="absolute inset-0 bg-background/40" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 border-b border-border/60 px-4 py-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">EasyBuilder</span>
      </div>

      <div ref={scrollRef} className="relative z-10 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2.5 text-sm">{m.content}</div>
            ) : (
              <div className="max-w-[92%]">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  EasyBuild
                </div>
                <AssistantText content={m.content} />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="max-w-[92%]">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              EasyBuild
            </div>
            <div className="mt-2">
              <ActivityLog log={activityLog} />
            </div>
          </div>
        )}

        {thinking && !loading && (
          <div className="flex items-center gap-2 pl-0.5 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
            {activityLog[activityLog.length - 1] ?? "Thinking..."}
          </div>
        )}
      </div>

      <div className="relative z-10 border-t border-border/60 bg-background p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            disabled={disabled}
            placeholder={disabled ? "Building..." : "Ask anything, or tell me what to change..."}
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!value.trim() || disabled}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
