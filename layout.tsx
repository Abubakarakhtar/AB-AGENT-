import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AB Agent — Your AI assistant",
  description: "AB Agent helps you chat, learn, plan, and write code.",
  manifest: "/manifest.json",
  themeColor: "#090d17",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
