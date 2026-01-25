import "../global.css";

export const metadata = {
  title: "Toronto AI Hack - Video Editor",
  description:
    "AI-powered video editor with autonomous repurposing capabilities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
