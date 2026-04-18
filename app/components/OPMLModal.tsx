"use client";

import { useState, useRef } from "react";

interface OPMLModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportProgress {
  total: number;
  completed: number;
  succeeded: number;
  failed: string[];
}

export default function OPMLModal({ onClose, onImportComplete }: OPMLModalProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setProgress(null);

    try {
      const text = await file.text();

      const res = await fetch("/api/opml/import", {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: text,
      });

      const data = await res.json() as { feeds: { url: string; title: string }[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to parse OPML");
        setImporting(false);
        return;
      }

      const feedList = data.feeds;
      const prog: ImportProgress = { total: feedList.length, completed: 0, succeeded: 0, failed: [] };
      setProgress({ ...prog });

      for (const feed of feedList) {
        try {
          const addRes = await fetch("/api/feeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: feed.url }),
          });
          if (addRes.ok) {
            prog.succeeded++;
          } else {
            const err = await addRes.json() as { error?: string };
            // Skip duplicates silently
            if (err.error?.includes("UNIQUE constraint")) {
              prog.succeeded++;
            } else {
              prog.failed.push(feed.title || feed.url);
            }
          }
        } catch {
          prog.failed.push(feed.title || feed.url);
        }
        prog.completed++;
        setProgress({ ...prog });
      }

      setDone(true);
      onImportComplete();
    } catch {
      setError("Failed to read file");
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/opml/export");
      if (!res.ok) {
        setError("Failed to export");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chronicle-export.opml";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[--text-primary]">Import / Export</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[--text-muted] hover:text-[--text-primary] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Import */}
          <div>
            <h3 className="text-sm font-medium text-[--text-primary] mb-2">Import OPML</h3>
            <p className="text-xs text-[--text-muted] mb-3">
              Import subscriptions from Feedly, Inoreader, or any reader that exports OPML.
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".opml,.xml"
                className="text-sm text-[--text-secondary] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[--border] file:text-xs file:font-medium file:text-[--text-secondary] file:bg-[--bg-secondary] file:cursor-pointer hover:file:bg-[--bg-tertiary] file:transition-colors"
                disabled={importing}
              />
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-1.5 text-sm font-medium text-white bg-[--accent] rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {importing ? "Importing…" : "Import"}
              </button>
            </div>

            {progress && (
              <div className="mt-3">
                <div className="w-full h-1.5 bg-[--bg-secondary] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[--accent] rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[--text-muted] mt-1.5">
                  {progress.completed} of {progress.total} feeds processed
                  {done && ` — ${progress.succeeded} added`}
                  {done && progress.failed.length > 0 && `, ${progress.failed.length} failed`}
                </p>
                {done && progress.failed.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Show failed feeds</summary>
                    <ul className="mt-1 text-xs text-[--text-muted] space-y-0.5 pl-4 list-disc">
                      {progress.failed.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[--border]" />

          {/* Export */}
          <div>
            <h3 className="text-sm font-medium text-[--text-primary] mb-2">Export OPML</h3>
            <p className="text-xs text-[--text-muted] mb-3">
              Download all subscriptions as an OPML file for backup or migration.
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-[--accent] border border-[--accent] rounded-lg hover:bg-[--accent-light] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download chronicle-export.opml
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
