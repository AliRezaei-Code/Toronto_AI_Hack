import type { Metadata } from "next";
import { ParticleBackground } from "@/src/components/ParticleBackground";
import { AuthProvider } from "@/src/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Script-Based Video Editor",
  description: "AI-powered video editor with transcript-based editing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="app-shell">
          <ParticleBackground />
          <div className="app-content">{children}</div>
        </div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
