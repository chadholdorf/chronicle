"use client";

import { useState, useEffect, useCallback } from "react";
import FeedList from "./components/FeedList";
import ItemList, { type ItemWithFeed } from "./components/ItemList";
import ReadingPane from "./components/ReadingPane";
import AddFeedModal from "./components/AddFeedModal";
import DigestModal from "./components/DigestModal";
import type { Feed, Digest } from "@/db/schema";

type View = { type: "all" } | { type: "feed"; feedId: string } | { type: "starred" };

export default function Home() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<ItemWithFeed[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemWithFeed | null>(null);
  const [view, setView] = useState<View>({ type: "all" });
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [lastDigest, setLastDigest] = useState<Digest | null>(null);

  useEffect(() => {
    loadFeeds();
    loadLastDigest();
  }, []);

  useEffect(() => {
    loadItems();
    setSelectedItem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    refreshFeeds(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFeeds() {
    try {
      const res = await fetch("/api/feeds");
      const data = await res.json() as Feed[];
      setFeeds(data);
    } catch (err) {
      console.error("Failed to load feeds:", err);
    }
  }

  async function loadItems() {
    setIsLoadingItems(true);
    try {
      let url = "/api/items?limit=100";
      if (view.type === "feed") url += `&feedId=${view.feedId}`;
      if (view.type === "starred") url += `&starred=true`;

      const res = await fetch(url);
      const data = await res.json() as ItemWithFeed[];
      setItems(data.map(deserializeItem));
    } catch (err) {
      console.error("Failed to load items:", err);
    } finally {
      setIsLoadingItems(false);
    }
  }

  async function loadLastDigest() {
    try {
      const res = await fetch("/api/digest");
      const { latest } = await res.json() as { latest: Digest | null };
      setLastDigest(latest);
    } catch {
      // non-critical
    }
  }

  async function refreshFeeds(force: boolean) {
    setIsRefreshing(true);
    try {
      await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      await loadFeeds();
      await loadItems();
    } catch (err) {
      console.error("Failed to refresh feeds:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleSelectItem = useCallback(async (item: ItemWithFeed) => {
    setSelectedItem(item);

    if (!item.isRead) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i))
      );
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === item.feedId ? { ...f, unreadCount: Math.max(0, f.unreadCount - 1) } : f
        )
      );

      try {
        await fetch(`/api/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
      } catch {
        // non-critical
      }
    }
  }, []);

  async function handleMarkAllRead() {
    const feedId = view.type === "feed" ? view.feedId : undefined;

    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    if (feedId) {
      setFeeds((prev) =>
        prev.map((f) => (f.id === feedId ? { ...f, unreadCount: 0 } : f))
      );
    } else {
      setFeeds((prev) => prev.map((f) => ({ ...f, unreadCount: 0 })));
    }

    try {
      await fetch("/api/items/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });
    } catch {
      // non-critical
    }
  }

  async function handleToggleStar(itemId: string, starred: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isStarred: starred } : i))
    );
    setSelectedItem((prev) => (prev?.id === itemId ? { ...prev, isStarred: starred } : prev));

    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: starred }),
      });
    } catch {
      // non-critical
    }
  }

  function handleSummaryGenerated(itemId: string, summary: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, summary } : i))
    );
    setSelectedItem((prev) => (prev?.id === itemId ? { ...prev, summary } : prev));
  }

  function getViewTitle(): string {
    if (view.type === "starred") return "Starred";
    if (view.type === "feed") {
      const feed = feeds.find((f) => f.id === view.feedId);
      return feed?.title ?? "Feed";
    }
    return "All Items";
  }

  const noFeedsYet = feeds.length === 0 && !isLoadingItems && !isRefreshing;

  return (
    <div className="flex h-screen overflow-hidden bg-[--bg-primary]">
      <FeedList
        feeds={feeds}
        selectedFeedId={view.type === "feed" ? view.feedId : null}
        onSelectFeed={(feedId) => setView(feedId ? { type: "feed", feedId } : { type: "all" })}
        onSelectStarred={() => setView({ type: "starred" })}
        isStarredSelected={view.type === "starred"}
        onAddFeed={() => setShowAddFeed(true)}
        onRefreshAll={() => refreshFeeds(true)}
        onDailyDigest={() => setShowDigest(true)}
        isRefreshing={isRefreshing}
        lastDigestAt={lastDigest ? new Date(lastDigest.createdAt) : null}
      />

      {noFeedsYet ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[--bg-secondary] text-center px-8">
          <div className="mb-8 opacity-20">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-[--accent] mx-auto">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-[--text-primary] mb-2">Nothing here yet</h2>
          <p className="text-[--text-secondary] mb-6">Add your first RSS feed to get started</p>
          <button
            onClick={() => setShowAddFeed(true)}
            className="px-5 py-2.5 bg-[--accent] text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            Add Feed
          </button>
        </div>
      ) : (
        <>
          <ItemList
            items={items}
            selectedItemId={selectedItem?.id ?? null}
            onSelectItem={handleSelectItem}
            onMarkAllRead={handleMarkAllRead}
            viewTitle={getViewTitle()}
            isLoading={isLoadingItems}
          />
          <ReadingPane
            item={selectedItem}
            onToggleStar={handleToggleStar}
            onSummaryGenerated={handleSummaryGenerated}
          />
        </>
      )}

      {showAddFeed && (
        <AddFeedModal
          onClose={() => setShowAddFeed(false)}
          onFeedAdded={async (feed) => {
            setFeeds((prev) => [feed, ...prev]);
            setView({ type: "feed", feedId: feed.id });
            await loadItems();
          }}
        />
      )}

      {showDigest && (
        <DigestModal
          onClose={() => setShowDigest(false)}
          onDigestCreated={(digest) => setLastDigest(digest)}
          lastDigest={lastDigest}
        />
      )}
    </div>
  );
}

function deserializeItem(item: ItemWithFeed): ItemWithFeed {
  return {
    ...item,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    fetchedAt: new Date(item.fetchedAt),
  };
}
