import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { summarizeArticle } from "@/app/lib/claude";

export async function POST(request: Request) {
  try {
    const { itemId } = await request.json() as { itemId: string };

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const [item] = await db.select().from(items).where(eq(items.id, itemId));

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Return cached summary if available
    if (item.summary) {
      return NextResponse.json({ summary: item.summary });
    }

    if (!item.content) {
      return NextResponse.json({ error: "No content available to summarize" }, { status: 422 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const summary = await summarizeArticle(item.content, item.title);

    await db.update(items).set({ summary }).where(eq(items.id, itemId));

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("POST /api/summarize error:", err);
    return NextResponse.json({ error: "Failed to summarize article" }, { status: 500 });
  }
}
