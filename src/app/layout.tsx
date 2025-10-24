import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ErrorNotifications from "@/components/ErrorNotifications";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "YUV PLUS - Plataforma de Telemetria Veicular",
  description: "Plataforma avançada de rastreamento e telemetria veicular em tempo real",
  keywords: "telemetria, rastreamento, veículos, IoT, GPS, streaming",
  authors: [{ name: "YUV PLUS Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-inter antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        {children}
        <ErrorNotifications />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
            },
          }}
        />
      </body>
    </html>
  );
}
