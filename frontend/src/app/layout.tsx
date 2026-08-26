import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together | 오답 분석",
  description: "AI 패턴 분류를 위한 Together 프론트엔드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
