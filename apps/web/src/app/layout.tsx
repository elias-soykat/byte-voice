import type { Metadata } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bytevoice.com.au"),
  title: {
    default: "ByteVoice by StrategyByte — AI Voice Receptionist for Bangladesh Healthcare",
    template: "%s · ByteVoice by StrategyByte",
  },
  description:
    "ByteVoice is StrategyByte's bilingual (Bangla & English) AI voice receptionist for Bangladesh healthcare — intelligent appointment booking, instant triage, and automated clinic workflows in natural Bangla.",
  keywords: [
    "ByteVoice",
    "StrategyByte",
    "AI receptionist",
    "Bangla voice AI",
    "Dhaka Dental Care",
    "healthcare automation",
    "clinic appointment booking",
    "Bangladesh medical scheduling",
    "voice AI",
    "LangGraph",
    "Sarvam AI",
    "Deepgram",
  ],
  authors: [{ name: "StrategyByte", url: "https://bytevoice.com.au" }],
  creator: "StrategyByte",
  openGraph: {
    type: "website",
    url: "https://bytevoice.com.au",
    siteName: "ByteVoice by StrategyByte",
    title: "ByteVoice by StrategyByte — AI Voice Receptionist for Bangladesh Healthcare",
    description:
      "A bilingual AI voice receptionist that books appointments in natural Bangla, answers patient inquiries, and automates clinic front-desk operations in real time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ByteVoice by StrategyByte — AI Voice Receptionist for Bangladesh Healthcare",
    description:
      "A bilingual AI voice receptionist that books appointments in natural Bangla, answers patient inquiries, and automates clinic front-desk operations in real time.",
    creator: "@elias-soykat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${hindSiliguri.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
