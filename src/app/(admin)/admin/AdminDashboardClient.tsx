"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";

interface PlayerWithDetails {
  id: string;
  name: string;
  telegram: string;
  phone: string;
  createdAt: string;
}

interface AdminDashboardClientProps {
  session: any;
  players: PlayerWithDetails[];
  dbError?: string | null;
}

export default function AdminDashboardClient({ session, players: initialPlayers, dbError }: AdminDashboardClientProps) {
  const [players, setPlayers] = useState<PlayerWithDetails[]>(initialPlayers || []);
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
  const router = useRouter();

  // DB Health Check
  const checkDbHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/db-health");
      if (!res.ok) throw new Error("DB health check failed");
      const { healthy } = await res.json();
      setDbHealthy(!!healthy);
      if (!healthy) {
        toast.error("Database is currently unavailable. Please try again later.");
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
    if (!newPlayerName.trim() || !newPlayerTelegram.trim() || !newPlayerPhone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
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
        telegram: newPlayerTelegram,
        phone: newPlayerPhone,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error || "Failed to add player to DB");
      setDbHealthy(false);
      return;
    }
    const { player } = await res.json();
    setPlayers([
      { ...player },
      ...players,
    ]);
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
          telegram: editTelegram,
          phone: editPhone,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to update player in DB");
        setEditLoading(false);
        return;
      }
      const { player } = await res.json();
      setPlayers(players.map((p) =>
        p.id === player.id ? { ...p, name: player.name, telegram: player.telegram, phone: player.phone } : p
      ));
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

  // Logout (client-side only)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Banner for DB downtime
  const dbBanner = dbHealthy === false ? (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 flex items-center" role="alert">
      <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />
      </svg>
      <span className="font-semibold">Database is unavailable.</span>
      <span className="ml-2">All player management actions are temporarily disabled. Please wait or contact support if this persists.</span>
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

  return (
    <div className="w-full max-w-2xl mx-auto px-2 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-2 ${
              dbHealthy === null
                ? 'bg-gray-400'
                : dbHealthy
                ? 'bg-green-500'
                : 'bg-red-500'
            }`}
            title={
              dbHealthy === null
                ? 'Checking database status...'
                : dbHealthy
                ? 'Database is healthy'
                : 'Database is unavailable'
            }
          ></span>
          <span className="text-sm text-gray-700">
            {dbHealthy === null
              ? 'Checking database status...'
              : dbHealthy
              ? 'Database is healthy'
              : 'Database is unavailable'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-center sm:text-left">Admin Dashboard</h1>
      </div>
      {dbBanner}
      <form onSubmit={handleAddPlayer} className="mb-6 flex flex-col sm:flex-row gap-2">
        {withDbTooltip(
          <Input
            placeholder="Player Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            disabled={dbHealthy === false}
            className="flex-1 min-w-0"
          />
        )}
        {withDbTooltip(
          <Input
            placeholder="Telegram Username"
            value={newPlayerTelegram}
            onChange={(e) => setNewPlayerTelegram(e.target.value)}
            disabled={dbHealthy === false}
            className="flex-1 min-w-0"
          />
        )}
        {withDbTooltip(
          <Input
            placeholder="Phone"
            value={newPlayerPhone}
            onChange={(e) => setNewPlayerPhone(e.target.value)}
            disabled={dbHealthy === false}
            className="flex-1 min-w-0"
          />
        )}
        {withDbTooltip(
          <Button type="submit" disabled={dbHealthy === false} className="w-full sm:w-auto">Add Player</Button>
        )}
      </form>
      <div className="space-y-4">
        {players.map((player) => (
          <Card key={player.id} className="w-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="truncate max-w-xs">{player.name}</CardTitle>
              <div className="flex gap-2 mt-2 sm:mt-0">
                {withDbTooltip(
                  <Button
                    onClick={() => openEditDialog(player)}
                    className="mr-2 px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:outline-none hover:bg-primary/90 active:scale-95"
                    disabled={dbHealthy === false || !!deleteLoadingId}
                  >
                    {editPlayer?.id === player.id && editLoading ? <Skeleton className="h-5 w-10" /> : "Edit"}
                  </Button>
                )}
                {withDbTooltip(
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePlayer(player.id)}
                    className="px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-destructive/70 focus-visible:outline-none hover:bg-destructive/90 active:scale-95"
                    disabled={dbHealthy === false || !!deleteLoadingId}
                  >
                    {deleteLoadingId === player.id ? <Skeleton className="h-5 w-14" /> : "Delete"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <div><span className="font-medium">Telegram:</span> {player.telegram}</div>
              <div><span className="font-medium">Phone:</span> {player.phone}</div>
              <div><span className="font-medium">Joined:</span> {new Date(player.createdAt).toLocaleDateString("en-CA")}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Edit Dialog */}
      {editPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 px-2">
          <div className="bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-6 w-full max-w-md mx-auto transition-colors duration-200">
            <h2 className="text-lg font-bold mb-2">Edit Player</h2>
            {withDbTooltip(
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mb-2"
                disabled={dbHealthy === false || editLoading}
              />
            )}
            {withDbTooltip(
              <Input
                value={editTelegram}
                onChange={(e) => setEditTelegram(e.target.value)}
                className="mb-2"
                disabled={dbHealthy === false || editLoading}
              />
            )}
            {withDbTooltip(
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="mb-2"
                disabled={dbHealthy === false || editLoading}
              />
            )}
            <div className="flex gap-2">
              {withDbTooltip(
                <Button onClick={handleEditSave} disabled={dbHealthy === false || editLoading}>
                  {editLoading ? <Skeleton className="h-5 w-20" /> : "Save"}
                </Button>
              )}
              {withDbTooltip(
                <Button variant="outline" onClick={closeEditDialog} disabled={dbHealthy === false || editLoading}>Cancel</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
