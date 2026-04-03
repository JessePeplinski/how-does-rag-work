'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import type { ChatUIMessage, RetrievedSource, ChunkScoreData, QueryTermData } from '@/lib/types';

// Context for sharing hovered term state between query viz and source cards
const HoveredTermContext = createContext<{
  hoveredTerm: string | null;
  setHoveredTerm: (term: string | null) => void;
  queryTerms: QueryTermData[];
}>({ hoveredTerm: null, setHoveredTerm: () => {}, queryTerms: [] });

function renderTextWithCitations(text: string) {
  const parts = text.split(/(\[Source \d+\])/g);
  return parts.map((part, i) => {
    if (/^\[Source \d+\]$/.test(part)) {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-300/20"
        >
          {part}
        </span>
      );
    }
    return <InteractiveText key={i} text={part} />;
  });
}

/** Renders text where each word is hoverable, triggering highlights in the sidebar */
function InteractiveText({ text, variant = 'assistant' }: { text: string; variant?: 'user' | 'assistant' }) {
  const { hoveredTerm, setHoveredTerm, queryTerms } = useContext(HoveredTermContext);

  const termSet = useRef(new Set<string>());
  termSet.current = new Set(queryTerms.map((t) => t.normalized));

  // Split preserving whitespace and punctuation as separate tokens
  const tokens = text.split(/(\s+)/);

  return (
    <>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }

        const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized.length <= 2) {
          return <span key={i}>{token}</span>;
        }

        const isQueryTerm = Array.from(termSet.current).some(
          (term) => normalized.startsWith(term) || term.startsWith(normalized),
        );
        const isHovered = hoveredTerm
          ? normalized.startsWith(hoveredTerm) || hoveredTerm.startsWith(normalized)
          : false;

        const userHovered = 'bg-white/30 ring-1 ring-white/50';
        const userQueryHint = 'underline decoration-white/40 decoration-wavy underline-offset-2';
        const userIdle = 'hover:bg-white/15';

        const assistantHovered = 'bg-blue-400/40 ring-1 ring-blue-400/60 dark:bg-blue-500/40 dark:ring-blue-400/50';
        const assistantQueryHint = 'underline decoration-blue-400/60 decoration-wavy underline-offset-2 dark:decoration-blue-400/60';
        const assistantIdle = 'hover:bg-blue-400/20 dark:hover:bg-blue-500/20';

        const isUser = variant === 'user';

        return (
          <span
            key={i}
            onMouseEnter={() => setHoveredTerm(normalized)}
            onMouseLeave={() => setHoveredTerm(null)}
            className={`cursor-pointer rounded-sm transition-all duration-150 ${
              isHovered
                ? (isUser ? userHovered : assistantHovered)
                : isQueryTerm
                  ? (isUser ? userQueryHint : assistantQueryHint)
                  : (isUser ? userIdle : assistantIdle)
            }`}
          >
            {token}
          </span>
        );
      })}
    </>
  );
}

function weightToColor(weight: number): string {
  if (weight >= 0.7) return 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100';
  if (weight >= 0.4) return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200';
  return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
}

function QueryTermsViz({ terms, isNew }: { terms: QueryTermData[]; isNew: boolean }) {
  const { hoveredTerm, setHoveredTerm } = useContext(HoveredTermContext);

  if (terms.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
      style={{
        animation: isNew ? 'fadeIn 400ms ease-out forwards' : 'none',
        opacity: isNew ? 0 : 1,
      }}
    >
      <div className="mb-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
        Query Terms
      </div>
      <div className="flex flex-wrap gap-1.5">
        {terms.map((term, i) => {
          const isHovered = hoveredTerm === term.normalized;
          const hasMatches = term.foundInSources.length > 0;
          return (
            <span
              key={i}
              onMouseEnter={() => setHoveredTerm(term.normalized)}
              onMouseLeave={() => setHoveredTerm(null)}
              className={`cursor-default rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                isHovered
                  ? 'scale-110 ring-2 ring-blue-500 shadow-md ' + weightToColor(term.weight)
                  : weightToColor(term.weight)
              } ${!hasMatches ? 'opacity-40' : ''}`}
              style={{
                animationDelay: isNew ? `${i * 60}ms` : '0ms',
                animation: isNew ? 'fadeIn 300ms ease-out forwards' : 'none',
                opacity: isNew ? 0 : undefined,
              }}
              title={`Weight: ${(term.weight * 100).toFixed(0)}% | Found in ${term.foundInSources.length} source(s)`}
            >
              {term.original}
              {hasMatches && (
                <span className="ml-1 text-[9px] opacity-60">
                  {term.foundInSources.length > 0 && `×${term.foundInSources.length}`}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[9px] text-zinc-400 dark:text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-4 rounded bg-blue-200 dark:bg-blue-800" />
          <span>High weight</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-4 rounded bg-sky-100 dark:bg-sky-900/50" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-4 rounded bg-zinc-100 dark:bg-zinc-800" />
          <span>Low / stop word</span>
        </div>
      </div>
      <p className="mt-1.5 text-[9px] italic text-zinc-400 dark:text-zinc-500">
        Hover a term to highlight where it appears in retrieved chunks
      </p>
    </div>
  );
}

function SimilarityChart({
  scores,
  isNew,
}: {
  scores: ChunkScoreData[];
  isNew: boolean;
}) {
  const [animatedWidths, setAnimatedWidths] = useState<boolean>(false);

  useEffect(() => {
    if (isNew) {
      setAnimatedWidths(false);
      const timer = setTimeout(() => setAnimatedWidths(true), 100);
      return () => clearTimeout(timer);
    }
    setAnimatedWidths(true);
  }, [scores, isNew]);

  const maxSimilarity = Math.max(...scores.map((s) => Math.abs(s.similarity)), 0.01);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
          Similarity Landscape
        </span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {scores.length} chunks compared
        </span>
      </div>
      <div className="space-y-1">
        {scores.map((score, i) => {
          const width = Math.max((Math.abs(score.similarity) / maxSimilarity) * 100, 2);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" style={{ height: score.selected ? '14px' : '8px' }}>
                <div
                  className={`h-full rounded-full transition-all ${
                    score.selected
                      ? 'bg-blue-500 dark:bg-blue-400'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                  style={{
                    width: animatedWidths ? `${width}%` : '0%',
                    transitionDuration: isNew ? `${600 + i * 40}ms` : '300ms',
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: isNew ? `${i * 30}ms` : '0ms',
                  }}
                />
              </div>
              <span className={`shrink-0 text-[9px] tabular-nums ${
                score.selected
                  ? 'font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`} style={{ width: '32px', textAlign: 'right' }}>
                {(score.similarity * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[9px] text-zinc-400 dark:text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="h-2 w-4 rounded-full bg-blue-500 dark:bg-blue-400" />
          <span>Selected (top 3)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-4 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span>Not selected</span>
        </div>
      </div>
    </div>
  );
}

/** Highlight matching query terms in chunk text */
function HighlightedChunkText({ text, maxLength }: { text: string; maxLength: number }) {
  const { hoveredTerm } = useContext(HoveredTermContext);
  const truncated = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

  if (!hoveredTerm) {
    return <>{truncated}</>;
  }

  // Split on word boundaries around the hovered term
  const regex = new RegExp(`(\\b${hoveredTerm}\\w{0,3})`, 'gi');
  const parts = truncated.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="rounded bg-blue-200 px-0.5 text-blue-900 dark:bg-blue-700 dark:text-blue-100"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function SourceCard({
  source,
  index,
  delay,
  injected,
}: {
  source: RetrievedSource;
  index: number;
  delay: number;
  injected: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [flying, setFlying] = useState(false);
  const { hoveredTerm } = useContext(HoveredTermContext);

  const isHighlighted = hoveredTerm
    ? new RegExp(`\\b${hoveredTerm}`, 'i').test(source.text)
    : false;

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    const flyTimer = injected ? undefined : setTimeout(() => setFlying(true), delay + 600);
    return () => {
      clearTimeout(showTimer);
      if (flyTimer) clearTimeout(flyTimer);
    };
  }, [delay, injected]);

  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm transition-all dark:bg-zinc-900 ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
      } ${flying ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/50' : ''} ${
        isHighlighted
          ? 'border-blue-400 ring-1 ring-blue-300/50 dark:border-blue-500 dark:ring-blue-500/30'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
      style={{
        transitionDuration: '500ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {source.title}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            source.similarity >= 0.5
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : source.similarity >= 0.3
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {(source.similarity * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        {source.sourceFile}
      </div>
      <p className="mt-1.5 line-clamp-4 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        <HighlightedChunkText text={source.text} maxLength={400} />
      </p>
      {flying && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400">
          <svg className="h-3 w-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Injected into prompt
        </div>
      )}
    </div>
  );
}

function MobileRetrievalSummary({
  sources,
  scores,
}: {
  sources: RetrievedSource[];
  scores: ChunkScoreData[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Retrieved {sources.length} chunks from {new Set(sources.map((s) => s.sourceFile)).size} docs
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            (best: {(Math.max(...sources.map((s) => s.similarity)) * 100).toFixed(1)}% match)
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          {/* Mini similarity bars */}
          <div className="mb-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            {scores.length} chunks compared
          </div>
          <div className="flex gap-0.5">
            {scores.map((score, i) => (
              <div
                key={i}
                className={`rounded-sm ${score.selected ? 'bg-blue-500 dark:bg-blue-400' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                style={{ height: `${Math.max(Math.abs(score.similarity) * 100, 4)}px`, width: `${100 / scores.length}%` }}
                title={`${score.title}: ${(score.similarity * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          {/* Source list */}
          <div className="mt-2 space-y-1">
            {sources.map((source, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">[{i + 1}]</span>{' '}
                  {source.title}
                </span>
                <span className="text-zinc-400">{(source.similarity * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RetrievalPanel({
  sources,
  scores,
  queryTerms,
  isNew,
}: {
  sources: RetrievedSource[];
  scores: ChunkScoreData[];
  queryTerms: QueryTermData[];
  isNew: boolean;
}) {
  if (sources.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
          <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-400 dark:text-zinc-500">
          Retrieval Pipeline
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Ask a question to see which document chunks are retrieved and injected into the LLM prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Query term analysis */}
      {queryTerms.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              1
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Analyze query terms
            </span>
          </div>
          <QueryTermsViz terms={queryTerms} isNew={isNew} />
        </div>
      )}

      {/* Step 2: Similarity landscape */}
      {scores.length > 0 && (
        <div
          style={{
            animation: isNew ? 'fadeIn 400ms ease-out forwards' : 'none',
            animationDelay: isNew ? '300ms' : '0ms',
            opacity: isNew ? 0 : 1,
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-[9px] font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              2
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Compare against all chunks
            </span>
          </div>
          <SimilarityChart scores={scores} isNew={isNew} />
        </div>
      )}

      {/* Step 3: Retrieved sources */}
      <div
        style={{
          animation: isNew ? 'fadeIn 400ms ease-out forwards' : 'none',
          animationDelay: isNew ? '600ms' : '0ms',
          opacity: isNew ? 0 : 1,
        }}
      >
        <div className="mb-1.5 flex items-center gap-1.5 px-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            3
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Top {sources.length} chunks retrieved
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {sources.map((source, i) => (
            <SourceCard
              key={`${source.sourceFile}-${source.similarity}-${i}`}
              source={source}
              index={i}
              delay={isNew ? 700 + i * 200 : 0}
              injected={!isNew}
            />
          ))}
        </div>
      </div>

      {/* Step 4: Injection note */}
      <div
        style={{
          animation: isNew ? 'fadeIn 500ms ease-out forwards' : 'none',
          animationDelay: isNew ? `${700 + sources.length * 200 + 600}ms` : '0ms',
          opacity: isNew ? 0 : 1,
        }}
      >
        <div className="mb-1.5 flex items-center gap-1.5 px-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-[9px] font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">
            4
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Augment &amp; Generate
          </span>
        </div>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Retrieved chunks are injected into the system prompt as context. The LLM generates a response grounded in this context with [Source N] citations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat<ChatUIMessage>();
  const [activeSources, setActiveSources] = useState<RetrievedSource[]>([]);
  const [activeScores, setActiveScores] = useState<ChunkScoreData[]>([]);
  const [activeQueryTerms, setActiveQueryTerms] = useState<QueryTermData[]>([]);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);
  const [isNewRetrieval, setIsNewRetrieval] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [stats, setStats] = useState<{ docCount: number; chunkCount: number } | null>(null);
  const prevMessageCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch knowledge base stats on mount
  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Track the latest sources, scores, and query terms from assistant messages
  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length === 0) return;

    const latest = assistantMessages[assistantMessages.length - 1];
    const sources = latest.parts
      .filter((p): p is { type: 'data-sources'; data: RetrievedSource[] } => p.type === 'data-sources')
      .flatMap((p) => p.data);
    const scores = latest.parts
      .filter((p): p is { type: 'data-scores'; data: ChunkScoreData[] } => p.type === 'data-scores')
      .flatMap((p) => p.data);
    const queryTerms = latest.parts
      .filter((p): p is { type: 'data-queryTerms'; data: QueryTermData[] } => p.type === 'data-queryTerms')
      .flatMap((p) => p.data);

    if (sources.length > 0) {
      const isNew = messages.length !== prevMessageCountRef.current;
      setActiveSources(sources);
      setActiveScores(scores);
      setActiveQueryTerms(queryTerms);
      setIsNewRetrieval(isNew);
      prevMessageCountRef.current = messages.length;
    }
  }, [messages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <HoveredTermContext.Provider value={{ hoveredTerm, setHoveredTerm, queryTerms: activeQueryTerms }}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                How does RAG work?
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                Prototype
              </span>
              {stats && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {stats.docCount} docs, {stats.chunkCount} chunks indexed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                How it works
              </button>
              <a
                href="https://github.com/JessePeplinski/how-does-rag-work"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                GitHub
              </a>
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A rapid prototype demonstrating Retrieval-Augmented Generation. Documents in{' '}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">docs/</code>{' '}
            are chunked, embedded, and retrieved via cosine similarity to ground LLM responses.
            Runs fully locally without an API key (TF-IDF fallback).
          </p>
        </header>

        {/* How it works modal */}
        {showHowItWorks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)}>
            <div className="mx-4 max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">How RAG Works</h2>
                <button type="button" onClick={() => setShowHowItWorks(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">1</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Index Documents</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Markdown files are split into chunks by paragraph, then each chunk is converted into a vector embedding.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">2</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Retrieve</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Your question is embedded and compared against all chunks using cosine similarity. The top 3 most similar chunks are selected.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">3</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Augment</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Retrieved chunks are injected into the LLM&apos;s system prompt as context, with source labels for citation tracking.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">4</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Generate</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">The LLM generates a response grounded in the retrieved context, citing sources with [Source N] notation.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  <strong>Local mode:</strong> Without an API key, embeddings use TF-IDF vectors and the generation step is skipped. The full retrieval pipeline still runs end-to-end.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main content: side panel + chat */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: Retrieval Pipeline Panel */}
          <aside className="hidden w-1/2 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 lg:block">
            <div className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Retrieval Pipeline
                </span>
              </div>
            </div>
            <RetrievalPanel sources={activeSources} scores={activeScores} queryTerms={activeQueryTerms} isNew={isNewRetrieval} />
          </aside>

          {/* Right: Chat */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Mobile: condensed retrieval summary */}
            {activeSources.length > 0 && (
              <MobileRetrievalSummary sources={activeSources} scores={activeScores} />
            )}

            {/* Messages */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
              <div className={`mx-auto w-full max-w-2xl space-y-4 ${messages.length === 0 ? 'flex flex-1 flex-col items-center justify-center' : ''}`}>
                {messages.length === 0 && (
                  <div className="text-center">
                    <p className="text-lg font-medium text-zinc-400 dark:text-zinc-500">
                      Try asking a question like:
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {[
                        'What is RAG and how does it work?',
                        'How does cosine similarity work?',
                        'What is chain-of-thought prompting?',
                        'Explain the ReAct agent pattern',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setInput(suggestion);
                          }}
                          className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      }`}
                    >
                      {message.parts.map((part, i) => {
                        if (part.type === 'text') {
                          if (message.role === 'user') {
                            return <span key={i}><InteractiveText text={part.text} variant="user" /></span>;
                          }
                          return (
                            <div key={i} className="whitespace-pre-wrap leading-relaxed">
                              {renderTextWithCitations(part.text)}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!input.trim() || isLoading) return;
                  const text = input;
                  setInput('');
                  sendMessage({ text });
                }}
                className="mx-auto flex max-w-2xl gap-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about RAG, vector databases, prompt engineering..."
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </HoveredTermContext.Provider>
  );
}
