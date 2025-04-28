// File: src/components/Navigation/MainNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  // { href: "/rules", label: "Rules" },
  { href: "/scoreboard", label: "Scoreboard" },
  {href: "/tournaments", label: "Tournaments"},
  // { href: "/calculator", label: "Points Calculator" },
  { href: "/admin", label: "Admin" }
];

function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // On mount, check system and localStorage
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };
  return (
    <button
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="ml-2 px-2 py-1 rounded border bg-muted hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

export function MainNavigation() {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Detect dark mode for navbar
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    const { error } = await import("@/lib/supabaseClient").then(({ supabase }) => supabase.auth.signOut());
    if (!error) {
      router.push("/");
    }
  };

  return (
    <nav className={cn(
      "container mx-auto px-2 py-3 flex flex-wrap justify-between items-center shadow-sm rounded-b-lg transition-colors",
      isDark ? "bg-card" : "bg-white"
    )}>
      <div className="flex items-center flex-shrink-0 mr-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
          All In Poker Club
        </Link>
      </div>
      <button className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Open Menu" onClick={() => setOpen(!open)}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div className={cn("w-full md:flex md:items-center md:w-auto", open ? "block" : "hidden")}> 
        <ul className="flex flex-col md:flex-row md:space-x-4 list-none p-0 m-0">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="my-1 md:my-0">
              <Link
                href={item.href}
                className={cn(
                  isDark
                    ? "text-gray-200 hover:text-white hover:bg-accent bg-transparent"
                    : "text-gray-600 hover:text-black hover:bg-gray-100 bg-transparent",
                  "transition-colors px-3 py-2 rounded-md text-lg md:text-base block",
                  pathname === item.href && (isDark ? "font-bold text-white bg-accent" : "font-bold text-black bg-gray-100")
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 md:mt-0 md:ml-4 flex flex-col md:flex-row gap-2 md:gap-0">
          {session ? (
            <Button variant="outline" onClick={handleLogout} className="w-full md:w-auto">Logout</Button>
          ) : (
            <Button variant="outline" asChild className="w-full md:w-auto">
              <Link href="/admin">Admin Login</Link>
            </Button>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
