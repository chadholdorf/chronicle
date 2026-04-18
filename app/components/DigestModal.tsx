"use client";

import { useState, useEffect } from "react";
import type { Digest } from "@/db/schema";
import { formatDistanceToNow } from "@/app/lib/time";

interface DigestModalProps {
  onClose: () => void;
  onDigestCreated: (digest: Digest) => void;
  lastDigest: Digest | null;
}

export default function DigestModal({ onClose, onDigestCreated, lastDigest }: DigestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDigest, setCurrentDigest] = useState<Digest | null>(lastDigest);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/digest", {
        method: "POST",
      });

      const data = await res.json() as Digest & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to generate digest");
        return;
      }

      setCurrentDigest(data);
      onDigestCreated(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate if no existing digest
  useEffect(() => {
    if (!lastDigest) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[--text-primary]">Daily Digest</h2>
            {currentDigest && (
              <p className="text-xs text-[--text-muted] mt-0.5">
                Generated {formatDistanceToNow(new Date(currentDigest.createdAt))} · {currentDigest.itemCount} items analyzed
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--accent] border border-[--accent] rounded-lg hover:bg-[--accent-light] disabled:opacity-50 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={loading ? "animate-spin" : ""}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {loading ? "Generating…" : "Regenerate"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[--text-muted] hover:text-[--text-primary] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && !currentDigest && (
            <div className="flex flex-col items-center justify-center py-16 text-[--text-muted]">
              <div className="w-8 h-8 border-2 border-[--border] border-t-[--accent] rounded-full animate-spin mb-4" />
              <p className="text-sm">Analyzing your feeds…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={handleGenerate}
                className="text-sm text-[--accent] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {currentDigest && !loading && (
            <div className="prose prose-sm prose-stone max-w-none whitespace-pre-line text-[--text-primary] leading-relaxed">
              {currentDigest.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
