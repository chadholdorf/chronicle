"use client";

import { formatDistanceToNow } from "@/app/lib/time";

export interface ItemWithFeed {
  id: string;
  feedId: string;
  title: string;
  url: string;
  content: string | null;
  summary: string | null;
  author: string | null;
  publishedAt: Date | null;
  fetchedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  feedTitle: string | null;
  feedFaviconUrl: string | null;
}

interface ItemListProps {
  items: ItemWithFeed[];
  selectedItemId: string | null;
  onSelectItem: (item: ItemWithFeed) => void;
  onMarkAllRead: () => void;
  viewTitle: string;
  isLoading: boolean;
}

export default function ItemList({
  items,
  selectedItemId,
  onSelectItem,
  onMarkAllRead,
  viewTitle,
  isLoading,
}: ItemListProps) {
  const unreadCount = items.filter((i) => !i.isRead).length;

  if (isLoading) {
    return (
      <div className="w-96 flex-shrink-0 border-r border-[--border] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[--border] border-t-[--accent] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-96 flex-shrink-0 border-r border-[--border] flex flex-col bg-white h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[--border] flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-[--text-primary] truncate">{viewTitle}</h2>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[--text-muted] hover:text-[--accent] transition-colors whitespace-nowrap ml-2"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-12 h-12 rounded-full bg-[--bg-secondary] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[--text-muted]">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[--text-primary]">All caught up</p>
            <p className="text-xs text-[--text-muted] mt-1">No items to show</p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`w-full text-left px-4 py-3 border-b border-[--border] transition-colors relative ${
                selectedItemId === item.id
                  ? "bg-[--accent-light]"
                  : "hover:bg-[--bg-secondary]"
              }`}
            >
              {/* Unread indicator */}
              {!item.isRead && (
                <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[--unread-indicator] rounded-r" />
              )}

              {/* Feed name in all-items view */}
              {item.feedTitle && (
                <div className="flex items-center gap-1 mb-1">
                  {item.feedFaviconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.feedFaviconUrl}
                      alt=""
                      width={12}
                      height={12}
                      className="w-3 h-3 rounded-sm"
                    />
                  )}
                  <span className="text-[10px] text-[--text-muted] uppercase tracking-wide truncate">
                    {item.feedTitle}
                  </span>
                </div>
              )}

              {/* Title */}
              <p className={`text-sm leading-snug ${item.isRead ? "font-normal text-[--text-secondary]" : "font-semibold text-[--text-primary]"}`}>
                {item.title}
              </p>

              {/* Date + preview */}
              <div className="flex items-start gap-2 mt-1">
                <span className="text-[10px] text-[--text-muted] flex-shrink-0 pt-0.5">
                  {item.publishedAt ? formatDistanceToNow(new Date(item.publishedAt)) : "Unknown"}
                </span>
                {item.content && (
                  <p className="text-[11px] text-[--text-muted] leading-relaxed line-clamp-2 flex-1">
                    {stripHtml(item.content).slice(0, 120)}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
