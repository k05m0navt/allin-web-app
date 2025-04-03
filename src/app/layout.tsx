// File: src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNavigation } from "@/components/Navigation/main-navigation";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "All In Poker Club",
  description: "Poker tournament management and tracking platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen")}>
        <MainNavigation />
        <main>{children}</main>
        <footer className="container mx-auto py-6 text-center">
          © {new Date().getFullYear()} All In Poker Club
        </footer>
      </body>
    </html>
  );
}
