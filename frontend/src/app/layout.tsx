import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import MeshBackground from "@/components/ui/MeshBackground";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiring Wallah — Autonomous Hiring Intelligence",
  description: "Autonomous Hiring Intelligence for job creation, resume analysis, candidate ranking, and evidence-backed hiring reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-bg-deep text-text-primary font-sans relative"
      >
        <MeshBackground fixed mode="full" opacity={0.22} className="z-0" />
        <div className="relative z-10 flex flex-col flex-1 min-h-full">
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
