"use client";

import { useState, useEffect, useCallback } from "react";
import FeedList from "./components/FeedList";
import ItemList, { type ItemWithFeed } from "./components/ItemList";
import ReadingPane from "./components/ReadingPane";
import AddFeedModal from "./components/AddFeedModal";
import DigestModal from "./components/DigestModal";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal";
import OPMLModal from "./components/OPMLModal";
import type { Feed, Digest } from "@/db/schema";

type View = { type: "all" } | { type: "feed"; feedId: string } | { type: "starred" };

// Mobile panel navigation
type MobilePanel = "feeds" | "items" | "reading";

export default function Home() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<ItemWithFeed[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemWithFeed | null>(null);
  const [view, setView] = useState<View>({ type: "all" });
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOPML, setShowOPML] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [lastDigest, setLastDigest] = useState<Digest | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("feeds");

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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs or modals are open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        showAddFeed ||
        showDigest ||
        showOPML
      ) {
        return;
      }

      // ? — toggle shortcuts help (allow closing too)
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Escape closes shortcuts modal
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
        return;
      }

      // Don't handle shortcuts while shortcuts modal is open (except ? and Escape above)
      if (showShortcuts) return;

      // j/n — next item
      if (e.key === "j" || e.key === "n") {
        e.preventDefault();
        navigateItems(1);
        return;
      }

      // k/p — previous item
      if (e.key === "k" || e.key === "p") {
        e.preventDefault();
        navigateItems(-1);
        return;
      }

      // s — star/unstar
      if (e.key === "s") {
        e.preventDefault();
        if (selectedItem) {
          handleToggleStar(selectedItem.id, !selectedItem.isStarred);
        }
        return;
      }

      // r — toggle read/unread
      if (e.key === "r") {
        e.preventDefault();
        if (selectedItem) {
          handleToggleRead(selectedItem.id, !selectedItem.isRead);
        }
        return;
      }

      // o — open original
      if (e.key === "o") {
        e.preventDefault();
        if (selectedItem) {
          window.open(selectedItem.url, "_blank", "noopener,noreferrer");
        }
        return;
      }

      // Shift+A — mark all read
      if (e.key === "A" && e.shiftKey) {
        e.preventDefault();
        handleMarkAllRead();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedItem, showAddFeed, showDigest, showShortcuts, showOPML]);

  function navigateItems(direction: number) {
    if (items.length === 0) return;

    if (!selectedItem) {
      handleSelectItem(items[0]);
      setMobilePanel("reading");
      return;
    }

    const currentIndex = items.findIndex((i) => i.id === selectedItem.id);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < items.length) {
      handleSelectItem(items[nextIndex]);
      setMobilePanel("reading");
    }
  }

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
    setMobilePanel("reading");

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

  async function handleToggleRead(itemId: string, isRead: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isRead } : i))
    );
    setSelectedItem((prev) => (prev?.id === itemId ? { ...prev, isRead } : prev));

    // Update feed unread count
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const delta = isRead ? -1 : 1;
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === item.feedId ? { ...f, unreadCount: Math.max(0, f.unreadCount + delta) } : f
        )
      );
    }

    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
    } catch {
      // non-critical
    }
  }

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

  function handleSelectFeed(feedId: string | null) {
    setView(feedId ? { type: "feed", feedId } : { type: "all" });
    setMobilePanel("items");
  }

  function handleSelectStarred() {
    setView({ type: "starred" });
    setMobilePanel("items");
  }

  const noFeedsYet = feeds.length === 0 && !isLoadingItems && !isRefreshing;

  return (
    <div className="flex h-screen overflow-hidden bg-[--bg-primary]">
      {/* Feed List — always visible on desktop, conditional on mobile (hidden when no feeds on mobile) */}
      <div className={`${mobilePanel === "feeds" && !noFeedsYet ? "flex" : "hidden"} md:flex flex-col w-full md:w-60 md:flex-shrink-0`}>
        <FeedList
          feeds={feeds}
          selectedFeedId={view.type === "feed" ? view.feedId : null}
          onSelectFeed={handleSelectFeed}
          onSelectStarred={handleSelectStarred}
          isStarredSelected={view.type === "starred"}
          onAddFeed={() => setShowAddFeed(true)}
          onRefreshAll={() => refreshFeeds(true)}
          onDailyDigest={() => setShowDigest(true)}
          onImportExport={() => setShowOPML(true)}
          isRefreshing={isRefreshing}
          lastDigestAt={lastDigest ? new Date(lastDigest.createdAt) : null}
        />
      </div>

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
          {/* Item List — always visible on desktop, conditional on mobile */}
          <div className={`${mobilePanel === "items" ? "flex" : "hidden"} md:flex flex-col w-full md:w-96 md:flex-shrink-0`}>
            <ItemList
              items={items}
              selectedItemId={selectedItem?.id ?? null}
              onSelectItem={handleSelectItem}
              onMarkAllRead={handleMarkAllRead}
              viewTitle={getViewTitle()}
              isLoading={isLoadingItems}
              onBack={() => setMobilePanel("feeds")}
              showBackButton={true}
            />
          </div>

          {/* Reading Pane — always visible on desktop, conditional on mobile */}
          <div className={`${mobilePanel === "reading" ? "flex" : "hidden"} md:flex flex-col flex-1`}>
            <ReadingPane
              item={selectedItem}
              onToggleStar={handleToggleStar}
              onSummaryGenerated={handleSummaryGenerated}
              onBack={() => setMobilePanel("items")}
              showBackButton={true}
            />
          </div>
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

      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showOPML && (
        <OPMLModal
          onClose={() => setShowOPML(false)}
          onImportComplete={async () => {
            await loadFeeds();
            await loadItems();
          }}
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
