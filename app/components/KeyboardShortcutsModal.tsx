"use client";

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["j", "n"], description: "Next item" },
  { keys: ["k", "p"], description: "Previous item" },
  { keys: ["s"], description: "Star / unstar" },
  { keys: ["r"], description: "Toggle read / unread" },
  { keys: ["o"], description: "Open original in new tab" },
  { keys: ["Shift", "a"], description: "Mark all read" },
  { keys: ["?"], description: "Show this help" },
];

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[--text-primary]">Keyboard Shortcuts</h2>
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

        <div className="px-6 py-4 space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between">
              <span className="text-sm text-[--text-secondary]">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-xs text-[--text-muted] mx-0.5">+</span>}
                    <kbd className="inline-block px-2 py-0.5 text-xs font-mono font-medium text-[--text-primary] bg-[--bg-secondary] border border-[--border] rounded">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-[--border]">
          <p className="text-xs text-[--text-muted] text-center">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[--bg-secondary] border border-[--border] rounded">Esc</kbd> or <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[--bg-secondary] border border-[--border] rounded">?</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
