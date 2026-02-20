import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Somospadel BCN - Generación de Imágenes con IA",
  description: "Generación profesional de imágenes con IA by Alex Coscolin. Crea imágenes increíbles para padel y más.",
  keywords: ["Somospadel", "BCN", "Padel", "IA", "Generación de imágenes", "Alex Coscolin"],
  authors: [{ name: "Alex Coscolin" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Somospadel BCN - Generación de Imágenes con IA",
    description: "Generación profesional de imágenes con IA by Alex Coscolin",
    url: "https://somospadel.bcn",
    siteName: "Somospadel BCN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somospadel BCN - Generación de Imágenes con IA",
    description: "Generación profesional de imágenes con IA by Alex Coscolin",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
