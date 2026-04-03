'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

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

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
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
                      sendMessage({ text: suggestion });
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
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || isLoading) return;
            sendMessage({ text: input });
            setInput('');
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
  );
}
