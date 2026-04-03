'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import type { ChatUIMessage, RetrievedSource } from '@/lib/types';

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
    return <span key={i}>{part}</span>;
  });
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
      className={`rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all dark:border-zinc-700 dark:bg-zinc-900 ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
      } ${flying ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/50' : ''}`}
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
        {source.text}
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

function RetrievalPanel({
  sources,
  isNew,
}: {
  sources: RetrievedSource[];
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
    <div className="flex flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2 px-1">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          Retrieved {sources.length} chunks
        </span>
      </div>
      {sources.map((source, i) => (
        <SourceCard
          key={`${source.sourceFile}-${source.similarity}-${i}`}
          source={source}
          index={i}
          delay={isNew ? i * 200 : 0}
          injected={!isNew}
        />
      ))}
      <div
        className="mt-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-800/50"
        style={{
          animation: isNew ? 'fadeIn 500ms ease-out forwards' : 'none',
          animationDelay: isNew ? `${sources.length * 200 + 800}ms` : '0ms',
          opacity: isNew ? 0 : 1,
        }}
      >
        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          Chunks injected into system prompt as context for the LLM
        </p>
      </div>
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat<ChatUIMessage>();
  const [activeSources, setActiveSources] = useState<RetrievedSource[]>([]);
  const [isNewRetrieval, setIsNewRetrieval] = useState(false);
  const prevMessageCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Track the latest sources from assistant messages
  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length === 0) return;

    const latest = assistantMessages[assistantMessages.length - 1];
    const sources = latest.parts
      .filter((p): p is { type: 'data-sources'; data: RetrievedSource[] } => p.type === 'data-sources')
      .flatMap((p) => p.data);

    if (sources.length > 0) {
      const isNew = messages.length !== prevMessageCountRef.current;
      setActiveSources(sources);
      setIsNewRetrieval(isNew);
      prevMessageCountRef.current = messages.length;
    }
  }, [messages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            RAG Demo
          </h1>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Prototype
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A rapid prototype demonstrating Retrieval-Augmented Generation. Documents in{' '}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">docs/</code>{' '}
          are chunked, embedded, and retrieved via cosine similarity to ground LLM responses.
          Runs fully locally without an API key (TF-IDF fallback).
        </p>
      </header>

      {/* Main content: side panel + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Retrieval Pipeline Panel */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 lg:block">
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
          <RetrievalPanel sources={activeSources} isNew={isNewRetrieval} />
        </aside>

        {/* Right: Chat */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.length === 0 && (
                <div className="py-12 text-center">
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
                          return <span key={i}>{part.text}</span>;
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
  );
}
