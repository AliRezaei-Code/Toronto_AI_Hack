import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Script-Based Video Editor",
  description: "AI-powered video editor with transcript-based editing",
};

// Nested layout - no <html> or <body> tags (those are in root layout)
export default function OldFrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
