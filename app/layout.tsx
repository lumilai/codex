import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "时隙｜战国临淄",
  description: "一场跨越两千三百年的历史沉浸实验",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
