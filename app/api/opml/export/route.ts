import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/app/lib/db";
import { feeds } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    await ensureSchema();
    const allFeeds = await db.select().from(feeds).orderBy(desc(feeds.createdAt));

    const now = new Date().toISOString();
    const outlines = allFeeds
      .map(
        (f) =>
          `      <outline type="rss" text="${escapeXML(f.title)}" title="${escapeXML(f.title)}" xmlUrl="${escapeXML(f.url)}" />`
      )
      .join("\n");

    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Chronicle RSS Subscriptions</title>
    <dateCreated>${now}</dateCreated>
  </head>
  <body>
    <outline text="Subscriptions" title="Subscriptions">
${outlines}
    </outline>
  </body>
</opml>`;

    return new NextResponse(opml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": 'attachment; filename="chronicle-export.opml"',
      },
    });
  } catch (err) {
    console.error("GET /api/opml/export error:", err);
    return NextResponse.json({ error: "Failed to export feeds" }, { status: 500 });
  }
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
