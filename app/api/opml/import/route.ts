import { NextResponse } from "next/server";

interface OPMLFeed {
  url: string;
  title: string;
}

export async function POST(request: Request) {
  try {
    const xml = await request.text();

    if (!xml.trim()) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const feeds = parseOPML(xml);

    if (feeds.length === 0) {
      return NextResponse.json(
        { error: "No feeds found in OPML file. Make sure it contains <outline> elements with xmlUrl attributes." },
        { status: 422 }
      );
    }

    return NextResponse.json({ feeds });
  } catch (err) {
    console.error("POST /api/opml/import error:", err);
    return NextResponse.json({ error: "Failed to parse OPML file" }, { status: 422 });
  }
}

function parseOPML(xml: string): OPMLFeed[] {
  const feeds: OPMLFeed[] = [];
  // Match outline elements with xmlUrl attribute (RSS/Atom feeds)
  const outlineRegex = /<outline\b[^>]*\bxmlUrl\s*=\s*"([^"]*)"[^>]*>/gi;
  let match;

  while ((match = outlineRegex.exec(xml)) !== null) {
    const fullTag = match[0];
    const xmlUrl = decodeXMLEntities(match[1]);

    // Extract title or text attribute
    const titleMatch = fullTag.match(/\btitle\s*=\s*"([^"]*)"/i);
    const textMatch = fullTag.match(/\btext\s*=\s*"([^"]*)"/i);
    const title = decodeXMLEntities(titleMatch?.[1] ?? textMatch?.[1] ?? xmlUrl);

    if (xmlUrl) {
      feeds.push({ url: xmlUrl, title });
    }
  }

  return feeds;
}

function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
