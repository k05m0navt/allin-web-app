// File: src/components/Navigation/MainNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/admin", label: "Admin" },
];

function DarkModeToggle({ fullWidth = false }: { fullWidth?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);
  // Ensure toggle matches SSR theme on first render
  useEffect(() => {
    // Defer to next tick to avoid hydration mismatch
    setTimeout(() => {
      setDark(document.documentElement.classList.contains("dark"));
    }, 0);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };
  if (dark === null) return null; // Prevent hydration mismatch
  return (
    <button
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={
        fullWidth
          ? "w-full min-h-[44px] min-w-[44px] px-4 py-2 rounded border bg-muted hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
          : "ml-2 px-2 py-1 rounded border bg-muted hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition min-h-[44px] min-w-[44px]"
      }
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

export function MainNavigation() {
  const session = useSession();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Focus trap and Esc close for mobile drawer
  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    drawer.addEventListener("keydown", handleKey);
    // Focus first item
    first?.focus();
    return () => drawer.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  // Show skeleton until mounted on client
  if (!mounted) {
    return (
      <nav className="w-full px-4 py-2 flex items-center justify-between shadow-sm bg-background sticky top-0 z-50">
        <Skeleton className="h-10 w-36 rounded" />
        <div className="flex gap-4 flex-1 justify-center">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </nav>
    );
  }

  // Show skeleton if session is undefined (loading)
  if (typeof session === "undefined") {
    return (
      <nav className="w-full px-4 py-2 flex items-center justify-between shadow-sm bg-background sticky top-0 z-50">
        <Skeleton className="h-10 w-36 rounded" />
        <div className="flex gap-4 flex-1 justify-center">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </nav>
    );
  }

  const handleLogout = async () => {
    const { error } = await import("@/lib/supabaseClient").then(
      ({ supabase }) => supabase.auth.signOut()
    );
    if (!error) {
      router.push("/");
    }
  };

  return (
    <nav className="w-full px-4 py-2 flex items-center justify-between shadow-sm bg-background sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 select-none" aria-label="Home">
        <span className="relative w-36 h-10">
          <Image
            src="/transparent_logo_light.png"
            alt="All In Poker Club Logo"
            fill
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/transparent_logo_dark.png"
            alt="All In Poker Club Logo Dark"
            fill
            className="object-contain hidden dark:block"
            priority
          />
        </span>
      </Link>
      <ul className="hidden md:flex gap-4 items-center">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "px-3 py-2 rounded transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px]",
                pathname === item.href ? "bg-accent font-semibold" : ""
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 ml-4">
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px]"
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="outline"
              asChild
              className="min-h-[44px] min-w-[44px]"
            >
              <Link href="/admin">Admin Login</Link>
            </Button>
          )}
          <DarkModeToggle />
        </div>
        {/* Hamburger menu button on the right for mobile */}
        <button
          className="md:hidden flex items-center justify-center rounded p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] pointer-events-auto"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="bg-black/40 backdrop-blur-sm flex-1"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            ref={drawerRef}
            tabIndex={-1}
            className={`w-64 bg-background shadow-lg h-full flex flex-col p-6 transition-transform duration-300 ease-in-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <button
              className="self-end mb-6 p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <ul className="flex flex-col gap-4 mb-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-4 py-3 rounded transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px]",
                      pathname === item.href ? "bg-accent font-semibold" : ""
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 mt-auto">
              {session ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] min-w-[44px]"
                >
                  Logout
                </Button>
              ) : (
                <Button
                  variant="outline"
                  asChild
                  className="w-full min-h-[44px] min-w-[44px]"
                >
                  <Link href="/admin">Admin Login</Link>
                </Button>
              )}
              <DarkModeToggle fullWidth />
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
}
