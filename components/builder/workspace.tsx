"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEveAgent } from "eve/react";
import type { EveMessage } from "eve/react";
import { ArrowUp, PanelsTopLeft } from "lucide-react";
import { getSavedBuild, saveBuildToHistory } from "@/lib/build-history";
import { runCompatibilityChecks } from "@/lib/buildcores";
import { Build, CATEGORY_ORDER, ChatMessage, ComponentCategory, PartOption, RequirementTier, TIER_LABEL } from "@/lib/types";
import { ConversationPanel } from "./conversation-panel";
import { SummaryPanel } from "./summary-panel";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/** Reads the most recent finished `finalize_build` tool call out of the live eve message stream. */
function extractBuild(messages: readonly EveMessage[]): Build | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i].parts;
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j];
      if (part.type === "dynamic-tool" && part.toolName === "finalize_build" && part.state === "output-available") {
        return part.output as Build;
      }
    }
  }
  return null;
}

function toChatMessages(messages: readonly EveMessage[]): ChatMessage[] {
  return messages
    .map((m) => ({
      id: m.id,
      role: (m.role === "user" ? "user" : "ai") as ChatMessage["role"],
      content: m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(""),
      timestamp: new Date().toISOString(),
    }))
    .filter((m) => m.content.trim().length > 0);
}

export function BuilderWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startedRef = useRef(false);

  const [revealed, setRevealed] = useState<Set<ComponentCategory>>(new Set());
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [idleValue, setIdleValue] = useState("");
  const [displayBuild, setDisplayBuild] = useState<Build | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const agent = useEveAgent({
    onEvent(event) {
      if (event.type === "turn.started") {
        setActivityLog([]);
        return;
      }
      if (event.type !== "actions.requested" && event.type !== "action.result" && event.type !== "action.partial") return;
      const labels = Object.values(event.data.presentation ?? {})
        .map((p) => p?.label)
        .filter((l): l is string => Boolean(l));
      const label = labels[labels.length - 1];
      if (!label) return;
      setActivityLog((prev) => (prev[prev.length - 1] === label ? prev : [...prev, label]));
    },
  });

  const agentBuild = useMemo(() => extractBuild(agent.data.messages), [agent.data.messages]);
  const messages = useMemo(() => toChatMessages(agent.data.messages), [agent.data.messages]);

  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const loading = (isBusy && !displayBuild) || loadingSaved;
  const thinking = isBusy && !!displayBuild;

  // The agent's own picks always take over once it produces one, whether this
  // is a fresh build or a build continued from a saved one (see below).
  const seenBuildId = useRef<string | null>(null);
  useEffect(() => {
    if (!agentBuild || agentBuild.id === seenBuildId.current) return;
    const isFirstBuild = seenBuildId.current === null;
    seenBuildId.current = agentBuild.id;
    setDisplayBuild(agentBuild);
    setSaved(false);
    setSaveError(null);
    if (isFirstBuild) {
      setRevealed(new Set());
      CATEGORY_ORDER.forEach((cat, i) => {
        setTimeout(() => setRevealed((prev) => new Set(prev).add(cat)), i * 260);
      });
    } else {
      setRevealed(new Set(CATEGORY_ORDER));
    }
  }, [agentBuild]);

  useEffect(() => {
    if (startedRef.current) return;
    const q = searchParams.get("q");
    const continueId = searchParams.get("continue");
    if (q) {
      startedRef.current = true;
      queueMicrotask(() => void agent.send(q));
    } else if (continueId) {
      startedRef.current = true;
      seenBuildId.current = "__seeded__";
      queueMicrotask(() => {
        setLoadingSaved(true);
        getSavedBuild(continueId).then((b) => {
          setLoadingSaved(false);
          if (b) {
            setDisplayBuild(b);
            setRevealed(new Set(CATEGORY_ORDER));
            setSaved(true);
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** Grounds the agent in the seeded build's requirements until it produces its own `finalize_build` result this session. */
  function seedContext() {
    if (agentBuild || !displayBuild) return undefined;
    const req = displayBuild.requirements;
    return {
      currentBuild: displayBuild.title,
      currentParts: Object.fromEntries(Object.entries(displayBuild.components).map(([cat, slot]) => [cat, slot?.part.name])),
      requirements: {
        tier: req.tier,
        primaryUse: req.primaryUse,
        games: req.games,
        apps: req.apps,
        resolution: req.resolution ?? null,
        formFactor: req.formFactor ?? null,
        quiet: req.quiet ?? false,
        mode: req.mode,
      },
    };
  }

  function onSend(text: string) {
    const clientContext = seedContext();
    void agent.send(text, clientContext ? { clientContext } : undefined);
  }

  function onTierChange(t: RequirementTier) {
    onSend(`Change the quality level of this build to ${TIER_LABEL[t]}.`);
  }

  function onSwapPart(category: ComponentCategory, part: PartOption) {
    setDisplayBuild((current) => {
      if (!current) return current;
      const previousName = current.components[category]?.part.name ?? "the previous part";
      const draft: Build = {
        ...current,
        components: {
          ...current.components,
          [category]: { part, reason: `Swapped in as an alternative to ${previousName}.` },
        },
      };
      draft.compatibility = runCompatibilityChecks(draft);
      return draft;
    });
    setSaved(false);
  }

  async function onSave() {
    if (!displayBuild) return;
    setSaveError(null);
    const result = await saveBuildToHistory(displayBuild);
    if (result.ok) {
      setSaved(true);
    } else if (result.error === "not_signed_in") {
      router.push(`/sign-in?next=/build`);
    } else {
      setSaveError(result.message ?? "Something went wrong. Try again in a moment.");
    }
  }

  if (!displayBuild && !isBusy && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <PanelsTopLeft size={22} className="text-muted-foreground/60" />
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">What are you building?</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Games, software, resolution, quality level, form factor: describe it however you like.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (idleValue.trim()) {
              startedRef.current = true;
              onSend(idleValue.trim());
              setIdleValue("");
            }
          }}
          className="mt-6 flex w-full max-w-lg items-end gap-2 rounded-2xl border border-border bg-card p-3 pl-5"
        >
          <textarea
            value={idleValue}
            onChange={(e) => setIdleValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (idleValue.trim()) {
                  startedRef.current = true;
                  onSend(idleValue.trim());
                  setIdleValue("");
                }
              }
            }}
            rows={1}
            placeholder="A high-end PC for 1440p gaming and Blender..."
            className="max-h-32 min-h-[26px] flex-1 resize-none bg-transparent py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!idleValue.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hidden h-full lg:grid lg:grid-cols-[420px_1fr] lg:grid-rows-[1fr] lg:divide-x lg:divide-border/60">
        <div className="overflow-hidden">
          <ConversationPanel messages={messages} loading={loading} thinking={thinking} activityLog={activityLog} onSend={onSend} />
        </div>
        <div className="overflow-hidden">
          {displayBuild ? (
            <SummaryPanel
              build={displayBuild}
              revealed={revealed}
              onSwapPart={onSwapPart}
              onTierChange={onTierChange}
              onSave={onSave}
              saved={saved}
              saveError={saveError}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Your build summary will appear here once the AI has parts to show.
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1">
          <ConversationPanel messages={messages} loading={loading} thinking={thinking} activityLog={activityLog} onSend={onSend} />
        </div>

        {displayBuild && (
          <div className="shrink-0 flex items-center justify-between border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Your build</div>
              <div className="font-heading text-base font-medium">{displayBuild.title}</div>
            </div>
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              View build
            </button>
          </div>
        )}
      </div>

      {displayBuild && (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetTitle className="sr-only">Build summary</SheetTitle>
            <SummaryPanel
              build={displayBuild}
              revealed={revealed}
              onSwapPart={onSwapPart}
              onTierChange={onTierChange}
              onSave={onSave}
              saved={saved}
              saveError={saveError}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
