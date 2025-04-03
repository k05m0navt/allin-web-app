// File: src/components/Navigation/MainNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/rules", label: "Rules" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/calculator", label: "Points Calculator" },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu className="container mx-auto py-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/" className="text-2xl font-bold mr-8">
          All In Poker Club
        </Link>
        <NavigationMenuList className="flex space-x-4">
          {NAV_ITEMS.map((item) => (
            <NavigationMenuItem key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "text-gray-600 hover:text-black transition-colors",
                  pathname === item.href && "font-bold text-black"
                )}
              >
                {item.label}
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </div>
      <div>
        <Button variant="outline" asChild>
          <Link href="/admin">Admin Login</Link>
        </Button>
      </div>
    </NavigationMenu>
  );
}
