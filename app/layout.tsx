import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chronicle — RSS, restored.",
  description: "An open source Google Reader revival with AI-powered summaries and daily digests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
