import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function summarizeArticle(content: string, title: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system:
      "You are a precise summarizer. Return exactly 3 sentences. First sentence: what happened. Second sentence: why it matters. Third sentence: what to watch. Be direct, no filler.",
    messages: [
      {
        role: "user",
        content: `Title: ${title}\n\nContent: ${content.slice(0, 8000)}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

export interface DigestItem {
  title: string;
  feedTitle: string;
  contentSnippet: string;
}

export async function generateDailyDigest(digestItems: DigestItem[]): Promise<string> {
  const itemsList = digestItems
    .map(
      (item, i) =>
        `${i + 1}. [${item.feedTitle}] ${item.title}\n   ${item.contentSnippet}`
    )
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system:
      "You are a sharp news editor. The user subscribes to these RSS feeds. Write a daily briefing in 4 sections: 1) The one story that matters most today and why. 2) Three other things worth knowing (2 sentences each). 3) One thing that is probably noise you can ignore. 4) One sentence on what to watch tomorrow. Be direct. No filler. No em dashes.",
    messages: [
      {
        role: "user",
        content: `Here are the most recent unread items from my RSS feeds:\n\n${itemsList}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}
