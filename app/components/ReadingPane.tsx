"use client";

import { useState } from "react";
import { formatDistanceToNow } from "@/app/lib/time";
import type { ItemWithFeed } from "./ItemList";

interface ReadingPaneProps {
  item: ItemWithFeed | null;
  onToggleStar: (itemId: string, starred: boolean) => void;
  onSummaryGenerated: (itemId: string, summary: string) => void;
}

export default function ReadingPane({ item, onToggleStar, onSummaryGenerated }: ReadingPaneProps) {
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  async function handleSummarize() {
    if (!item || summarizing) return;

    setSummarizing(true);
    setSummaryError(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      const data = await res.json() as { summary?: string; error?: string };

      if (!res.ok) {
        setSummaryError(data.error ?? "Failed to summarize");
        return;
      }

      if (data.summary) {
        onSummaryGenerated(item.id, data.summary);
      }
    } catch {
      setSummaryError("Network error. Please try again.");
    } finally {
      setSummarizing(false);
    }
  }

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[--bg-secondary] text-center px-8">
        <div className="mb-6 opacity-20">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-[--accent] mx-auto">
            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[--text-primary] mb-2">Chronicle</h2>
        <p className="text-[--text-secondary]">RSS, restored.</p>
        <p className="text-sm text-[--text-muted] mt-4">Select an article to start reading</p>
      </div>
    );
  }

  const hasSummary = Boolean(item.summary);
  const hasContent = Boolean(item.content);

  return (
    <article className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-8 py-8">
        {/* Meta bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {item.feedFaviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.feedFaviconUrl} alt="" width={16} height={16} className="w-4 h-4 rounded-sm" />
            )}
            <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wide">
              {item.feedTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStar(item.id, !item.isStarred)}
              className={`p-1.5 rounded-lg transition-colors ${
                item.isStarred
                  ? "text-[--accent] bg-[--accent-light]"
                  : "text-[--text-muted] hover:text-[--accent] hover:bg-[--accent-light]"
              }`}
              title={item.isStarred ? "Unstar" : "Star"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={item.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[--text-muted] hover:text-[--accent] transition-colors px-2 py-1 rounded-lg hover:bg-[--accent-light]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open original
            </a>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[--text-primary] leading-snug mb-3">
          {item.title}
        </h1>

        {/* Byline */}
        <div className="flex items-center gap-3 text-xs text-[--text-muted] mb-6 pb-6 border-b border-[--border]">
          {item.author && <span>{item.author}</span>}
          {item.author && item.publishedAt && <span>·</span>}
          {item.publishedAt && (
            <span>{formatDistanceToNow(new Date(item.publishedAt))}</span>
          )}
        </div>

        {/* AI Summary */}
        {hasSummary && (
          <div className="mb-6 p-4 bg-[--accent-light] border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-[--accent] rounded flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">AI Summary</span>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed">{item.summary}</p>
          </div>
        )}

        {/* Summarize button */}
        {!hasSummary && (
          <div className="mb-6">
            <button
              onClick={handleSummarize}
              disabled={summarizing || !hasContent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[--accent] border border-[--accent] rounded-lg hover:bg-[--accent-light] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {summarizing ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
                  Summarizing…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  {!hasContent ? "No content to summarize" : "Summarize with AI"}
                </>
              )}
            </button>
            {summaryError && (
              <p className="mt-2 text-xs text-red-600">{summaryError}</p>
            )}
          </div>
        )}

        {/* Article content */}
        {hasContent ? (
          <div
            className="prose prose-sm prose-stone max-w-none reading-content"
            dangerouslySetInnerHTML={{ __html: item.content! }}
          />
        ) : (
          <div className="text-center py-12 text-[--text-muted]">
            <p className="text-sm">No content available in the feed.</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[--accent] hover:underline mt-2 inline-block"
            >
              Read on the original site
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
