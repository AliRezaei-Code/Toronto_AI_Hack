import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { ParticleBackground } from "@/src/components/ParticleBackground";
import { AuthProvider } from "@/src/contexts/AuthContext";
import "../globals.css";

// Rententio Brand Fonts
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const formula = localFont({
  variable: "--font-formula",
  display: "swap",
  src: [
    {
      path: "../fonts/PPFormula-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/PPFormula-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/PPFormula-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/PPFormula-SemiExtendedBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Rententio - AI-Powered Video Editing",
  description:
    "Edit for attention and retention. Rententio analyzes your footage and edits for maximum viewer retention.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${formula.variable}`}>
      <body className="app-body">
        <div className="app-shell">
          <ParticleBackground />
          <div className="app-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
