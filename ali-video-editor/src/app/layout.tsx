/**
 * Root layout for Video Copilot application
 */

import { ParticleBackgroundMotion } from "@/components/background/ParticleBackgroundMotion";
import { SessionProvider } from "@/components/providers/SessionProvider";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const doto = localFont({
  src: "../../fonts/Doto,Sarpanch/Doto/Doto-VariableFont_ROND,wght.ttf",
  variable: "--font-doto",
  display: "swap",
});

const sarpanch = localFont({
  src: [
    {
      path: "../../fonts/Doto,Sarpanch/Sarpanch/Sarpanch-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/Doto,Sarpanch/Sarpanch/Sarpanch-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/Doto,Sarpanch/Sarpanch/Sarpanch-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/Doto,Sarpanch/Sarpanch/Sarpanch-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/Doto,Sarpanch/Sarpanch/Sarpanch-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../fonts/Doto,Sarpanch/Sarpanch/Sarpanch-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sarpanch",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Video Copilot - AI-Powered Video Analysis",
  description: "AI-powered video analysis and optimization platform",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${doto.variable} ${sarpanch.variable}`}>
      <body className={doto.className}>
        <SessionProvider>
          <div className="relative min-h-screen">
            <ParticleBackgroundMotion />
            <div className="relative z-10">{children}</div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
