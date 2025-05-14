"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import AdminPlayerTable from "@/components/AdminPlayerTable";
import AdminTournamentTable from "@/components/AdminTournamentTable";

interface PlayerWithDetails {
  id: string;
  name: string;
  telegram: string;
  phone: string;
  createdAt: string;
}

interface AdminDashboardClientProps {
  session: unknown;
  players: PlayerWithDetails[];
  dbError?: string | null;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string | null;
}

interface ClubStatistics {
  totalPlayers: number;
  totalTournaments: number;
  totalReentries: number;
  totalPoints: number;
  error?: string;
}

const TABS = ["Players", "Tournaments", "Statistics"];

export default function AdminDashboardClient({
  players: initialPlayers,
  dbError,
}: AdminDashboardClientProps) {
  const [players, setPlayers] = useState<PlayerWithDetails[]>(
    initialPlayers || []
  );
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTelegram, setNewPlayerTelegram] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");
  const [editPlayer, setEditPlayer] = useState<PlayerWithDetails | null>(null);
  const [editName, setEditName] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [addPlayerNameError, setAddPlayerNameError] = useState(false);

  const router = useRouter();

  // Add state for pagination
  const [playerPage, setPlayerPage] = useState(1);
  const [playerTotalPages, setPlayerTotalPages] = useState(1);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerTotal, setPlayerTotal] = useState(0);

  // Fetch paginated players
  const fetchPlayers = useCallback(async (page = 1) => {
    setPlayerLoading(true);
    try {
      const res = await fetch(`/api/players?page=${page}&limit=20`);
      const data = await res.json();
      setPlayers(data.players || []);
      setPlayerPage(data.page || 1);
      setPlayerTotalPages(data.totalPages || 1);
      setPlayerTotal(data.total || (data.players?.length || 0) * (data.totalPages || 1));
    } finally {
      setPlayerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers(playerPage);
  }, [playerPage]);

  // DB Health Check
  const checkDbHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/db-health");
      if (!res.ok) throw new Error("DB health check failed");
      const { healthy } = await res.json();
      setDbHealthy(!!healthy);
      if (!healthy) {
        toast.error(
          "Database is currently unavailable. Please try again later."
        );
      }
    } catch {
      setDbHealthy(false);
      toast.error("Database is currently unavailable. Please try again later.");
    }
  }, []);

  useEffect(() => {
    checkDbHealth();
    const interval = setInterval(checkDbHealth, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [checkDbHealth]);

  useEffect(() => {
    if (dbError) {
      toast.error(`Database error: ${dbError}`);
    }
  }, [dbError]);

  // Add Player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      setAddPlayerNameError(true);
      toast.error("Please enter a name");
      return;
    }
    setAddPlayerNameError(false);
    try {
      const healthRes = await fetch("/api/admin/db-health");
      const healthData = await healthRes.json();
      if (!healthData.healthy) {
        toast.error("Cannot add player: Database is currently unavailable.");
        setDbHealthy(false);
        return;
      }
    } catch {
      toast.error("Cannot add player: Database is currently unavailable.");
      setDbHealthy(false);
      return;
    }
    const res = await fetch("/api/admin/add-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPlayerName,
        telegram: newPlayerTelegram || undefined,
        phone: newPlayerPhone || undefined,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error || "Failed to add player to DB");
      setDbHealthy(false);
      return;
    }
    const { player } = await res.json();
    setPlayers([{ ...player }, ...players]);
    setNewPlayerName("");
    setNewPlayerTelegram("");
    setNewPlayerPhone("");
    toast.success("Player added!");
  };

  // Edit Player
  const openEditDialog = (player: PlayerWithDetails) => {
    setEditPlayer(player);
    setEditName(player.name);
    setEditTelegram(player.telegram);
    setEditPhone(player.phone);
  };
  const closeEditDialog = () => {
    setEditPlayer(null);
    setEditName("");
    setEditTelegram("");
    setEditPhone("");
  };
  const handleEditSave = async () => {
    if (!editPlayer) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/players/${editPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          telegram: editTelegram || undefined,
          phone: editPhone || undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to update player in DB");
        setEditLoading(false);
        return;
      }
      const { player } = await res.json();
      setPlayers(
        players.map((p) =>
          p.id === player.id
            ? {
                ...p,
                name: player.name,
                telegram: player.telegram,
                phone: player.phone,
              }
            : p
        )
      );
      toast.success("Player updated!");
      closeEditDialog();
    } catch {
      toast.error("Failed to update player in DB");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Player
  const handleDeletePlayer = async (playerId: string) => {
    setDeleteLoadingId(playerId);
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to delete player from DB");
        setDeleteLoadingId(null);
        return;
      }
      setPlayers(players.filter((p) => p.id !== playerId));
      toast.success("Player deleted!");
    } catch {
      toast.error("Failed to delete player from DB");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Statistics state
  const [statistics, setStatistics] = useState<ClubStatistics | null>(null);
  useEffect(() => {
    fetch("/api/statistics")
      .then((res) => res.json())
      .then((data) => {
        if (
          typeof data.totalPlayers === "number" &&
          typeof data.totalTournaments === "number" &&
          typeof data.totalReentries === "number" &&
          typeof data.totalPoints === "number"
        ) {
          setStatistics(data);
        } else {
          setStatistics({
            totalPlayers: 0,
            totalTournaments: 0,
            totalReentries: 0,
            totalPoints: 0,
            error: data.error || "Failed to load statistics",
          });
        }
      })
      .catch(() =>
        setStatistics({
          totalPlayers: 0,
          totalTournaments: 0,
          totalReentries: 0,
          totalPoints: 0,
          error: "Failed to load statistics",
        })
      );
  }, []);

  // Banner for DB downtime
  const dbBanner =
    dbHealthy === false ? (
      <div
        className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4 flex items-center"
        role="alert"
      >
        <svg
          className="w-5 h-5 mr-2 text-red-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z"
          />
        </svg>
        <span className="font-semibold">Database is unavailable.</span>
        <span className="ml-2">
          All player management actions are temporarily disabled. Please wait or
          contact support if this persists.
        </span>
      </div>
    ) : null;

  // Tooltip helper for disabled actions
  const withDbTooltip = (element: React.ReactNode) =>
    dbHealthy === false ? (
      <span className="group relative inline-block">
        {element}
        <span className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Database unavailable
        </span>
      </span>
    ) : (
      <>{element}</>
    );

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-6">
      <div className="flex flex-col sm:items-center sm:justify-between gap-2 mb-6">
        <h1 className="text-2xl font-bold text-center sm:text-left">
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-2 ${
              dbHealthy === null
                ? "bg-gray-400 dark:bg-gray-700"
                : dbHealthy
                ? "bg-green-500 dark:bg-green-400"
                : "bg-red-500 dark:bg-red-400"
            }`}
            title={
              dbHealthy === null
                ? "Checking database status..."
                : dbHealthy
                ? "Database is healthy"
                : "Database is unavailable"
            }
          ></span>
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {dbHealthy === null
              ? "Checking database status..."
              : dbHealthy
              ? "Database is healthy"
              : "Database is unavailable"}
          </span>
        </div>
      </div>
      <div className="mb-6">
        <nav className="flex rounded-lg bg-muted p-1 w-fit mx-auto shadow-sm border border-muted-foreground/10">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              className={cn(
                "px-5 py-2 text-base font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                activeTab === idx
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
              onClick={() => setActiveTab(idx)}
              tabIndex={0}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      {activeTab === 0 && (
        <div>
          {dbBanner}
          <AdminPlayerTable />
        </div>
      )}
      {activeTab === 1 && (
        <div>
          <AdminTournamentTable />
        </div>
      )}
      {activeTab === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-4">Club Statistics</h2>
          {!statistics ? (
            <div>Loading statistics...</div>
          ) : statistics.error ? (
            <div className="text-destructive">{statistics.error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalPlayers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Tournaments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalTournaments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Re-entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalReentries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Points Awarded</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalPoints}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
