"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScoreboardPagination } from "./ScoreboardPagination";
import { Skeleton } from "@/components/ui/Skeleton";

export interface ScoreboardPlayer {
  id: string;
  rank: number;
  name: string;
  totalPoints: number;
  tournaments: number;
  bounty: number;
  averageRank: number;
}

interface ScoreboardTableProps {
  players: ScoreboardPlayer[];
  loading: boolean;
}

const sortOptions = [
  { label: "Total Points", value: "totalPoints" },
  { label: "Tournaments", value: "tournaments" },
  { label: "Average Rank", value: "averageRank" },
  { label: "Name", value: "name" },
  { label: "Bounty", value: "bounty" },
];

export function ScoreboardTable({ players, loading }: ScoreboardTableProps) {
  const [sortBy, setSortBy] = useState<string>("totalPoints");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const perPage = 10;

  const filteredPlayers = useMemo(() => {
    let filtered = players.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    filtered = filtered.sort((a, b) => {
      if (sortBy === "name") {
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === "averageRank") {
        return sortDir === "asc"
          ? a.averageRank - b.averageRank
          : b.averageRank - a.averageRank;
      }
      if (sortBy === "totalPoints") {
        return sortDir === "asc"
          ? a.totalPoints - b.totalPoints
          : b.totalPoints - a.totalPoints;
      }
      if (sortBy === "tournaments") {
        return sortDir === "asc"
          ? a.tournaments - b.tournaments
          : b.tournaments - a.tournaments;
      }
      if (sortBy === "rank") {
        return sortDir === "asc"
          ? a.rank - b.rank
          : b.rank - a.rank;
      }
      if (sortBy === "bounty") {
        return sortDir === "asc"
          ? a.bounty - b.bounty
          : b.bounty - a.bounty;
      }
      return 0;
    });
    return filtered;
  }, [players, sortBy, sortDir, search]);

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPlayers.slice(start, start + perPage);
  }, [filteredPlayers, page, perPage]);

  // Map sortDir to aria-sort values
  function getAriaSort(col: string, sortBy: string, sortDir: "asc" | "desc") {
    if (col !== sortBy) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  // Responsive rendering is now handled purely by CSS (Tailwind's sm:hidden/sm:block)
  // Removed isMobile JS check to avoid SSR/CSR mismatch

  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-10 w-full mb-2 rounded" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full mb-1 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 justify-between items-center">
        <Input
          placeholder="Search player..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
          aria-label="Search player by name"
        />
        <div className="flex gap-2 items-center">
          <label htmlFor="sortBy" className="text-sm text-muted-foreground">
            Sort by:
          </label>
          <select
            id="sortBy"
            className="border rounded px-2 py-1 text-sm"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            className="ml-1 text-xs px-2 py-1 rounded border bg-muted hover:bg-accent"
            aria-label="Toggle sort direction"
            onClick={() => {
              setSortDir(sortDir === "asc" ? "desc" : "asc");
              setPage(1);
            }}
          >
            {sortDir === "asc" ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {/* Mobile: Show cards */}
      <div className="sm:hidden space-y-4">
        {paginatedPlayers.map((player) => (
          <div
            key={player.id}
            className="rounded-lg shadow bg-card p-4 flex flex-col gap-2 hover:bg-accent/30 transition"
            tabIndex={0}
            aria-label={`View profile for ${player.name}`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar removed as requested */}
              <div>
                <Link
                  href={`/players/${player.id}`}
                  className="font-semibold text-primary underline hover:text-primary/80 text-lg"
                >
                  {player.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Rank #{player.rank}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-sm mt-1">
              <div>
                <span className="font-medium">Points:</span>{" "}
                {player.totalPoints}
              </div>
              <div>
                <span className="font-medium">Tourn.:</span>{" "}
                {player.tournaments}
              </div>
              <div>
                <span className="font-medium">Bounty:</span>{" "}
                {player.bounty}
              </div>
              <div>
                <span className="font-medium">Avg Rank:</span>{" "}
                {player.averageRank.toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: Show table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg shadow">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortBy("rank");
                  setSortDir(sortBy === "rank" && sortDir === "asc" ? "desc" : "asc");
                  setPage(1);
                }}
                aria-sort={getAriaSort("rank", sortBy, sortDir)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSortBy("rank");
                    setSortDir(sortBy === "rank" && sortDir === "asc" ? "desc" : "asc");
                    setPage(1);
                  }
                }}
              >
                Rank {sortBy === "rank" && (sortDir === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortBy("name");
                  setSortDir(sortBy === "name" && sortDir === "asc" ? "desc" : "asc");
                  setPage(1);
                }}
                aria-sort={getAriaSort("name", sortBy, sortDir)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSortBy("name");
                    setSortDir(sortBy === "name" && sortDir === "asc" ? "desc" : "asc");
                    setPage(1);
                  }
                }}
              >
                Player {sortBy === "name" && (sortDir === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortBy("totalPoints");
                  setSortDir(sortBy === "totalPoints" && sortDir === "asc" ? "desc" : "asc");
                  setPage(1);
                }}
                aria-sort={getAriaSort("totalPoints", sortBy, sortDir)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSortBy("totalPoints");
                    setSortDir(sortBy === "totalPoints" && sortDir === "asc" ? "desc" : "asc");
                    setPage(1);
                  }
                }}
              >
                Total Points {sortBy === "totalPoints" && (sortDir === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortBy("tournaments");
                  setSortDir(sortBy === "tournaments" && sortDir === "asc" ? "desc" : "asc");
                  setPage(1);
                }}
                aria-sort={getAriaSort("tournaments", sortBy, sortDir)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSortBy("tournaments");
                    setSortDir(sortBy === "tournaments" && sortDir === "asc" ? "desc" : "asc");
                    setPage(1);
                  }
                }}
              >
                Tournaments {sortBy === "tournaments" && (sortDir === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortBy("bounty");
                  setSortDir(sortBy === "bounty" && sortDir === "asc" ? "desc" : "asc");
                  setPage(1);
                }}
                aria-sort={getAriaSort("bounty", sortBy, sortDir)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSortBy("bounty");
                    setSortDir(sortBy === "bounty" && sortDir === "asc" ? "desc" : "asc");
                    setPage(1);
                  }
                }}
              >
                Bounty {sortBy === "bounty" && (sortDir === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortBy("averageRank");
                  setSortDir(sortBy === "averageRank" && sortDir === "asc" ? "desc" : "asc");
                  setPage(1);
                }}
                aria-sort={getAriaSort("averageRank", sortBy, sortDir)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSortBy("averageRank");
                    setSortDir(sortBy === "averageRank" && sortDir === "asc" ? "desc" : "asc");
                    setPage(1);
                  }
                }}
              >
                Average Rank {sortBy === "averageRank" && (sortDir === "asc" ? "▲" : "▼")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlayers.map((player) => (
              <TableRow
                key={player.id}
                className="hover:bg-accent/30 focus-within:bg-accent/40"
              >
                <TableCell className="font-semibold">{player.rank}</TableCell>
                <TableCell>
                  <Link
                    href={`/players/${player.id}`}
                    className="text-primary underline hover:text-primary/80"
                  >
                    {/* Avatar removed as requested */}
                    {player.name}
                  </Link>
                </TableCell>
                <TableCell>{player.totalPoints}</TableCell>
                <TableCell>{player.tournaments}</TableCell>
                <TableCell>{player.bounty}</TableCell>
                <TableCell>{player.averageRank.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ScoreboardPagination
        total={filteredPlayers.length}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        loading={loading}
      />
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <span>Tap a player to view their profile and tournament history.</span>
      </div>
    </div>
  );
}
