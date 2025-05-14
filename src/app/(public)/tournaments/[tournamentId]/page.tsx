"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { PlayerAutocomplete } from "@/components/ui/PlayerAutocomplete";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Player {
  id: string;
  name: string;
  rank?: number;
  points?: number;
  bounty?: number;
  reentries?: number;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string | null;
  players: Player[];
  buyin?: number;
  rebuy?: number;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string | null;
  players: Player[];
}

export default function TournamentPublicDetailPage() {
  const { tournamentId } = useParams() as { tournamentId: string };
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [addPlayerIds, setAddPlayerIds] = useState<string[]>([]);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchTournament() {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}`);
    if (res.ok) {
      const data = await res.json();
      setTournament(data.data.tournament);
      setEditTournament(data.data.tournament);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAdmin(user?.user_metadata?.role === "ADMIN");
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchAllPlayers() {
      const res = await fetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        setAllPlayers(data.players);
      }
    }
    fetchAllPlayers();
  }, [isAdmin]);

  const handleEditSave = async () => {
    if (!editTournament) return;
    setSaving(true);
    const res = await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editTournament.name,
        date: editTournament.date,
        location: editTournament.location,
        description: editTournament.description,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to update tournament");
      return;
    }
    await fetchTournament();
    setEditMode(false);
    toast.success("Tournament updated!");
  };

  const handleAddPlayer = async () => {
    if (addPlayerIds.length === 0) return;
    setAddingPlayer(true);
    for (const playerId of addPlayerIds) {
      const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || `Failed to add player ${playerId}`);
      }
    }
    setAddingPlayer(false);
    setAddPlayerIds([]);
    const refetch = await fetch(`/api/tournaments/${tournamentId}`);
    if (refetch.ok) {
      const data = await refetch.json();
      setTournament(data.data.tournament);
      setEditTournament(data.data.tournament);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (confirmRemove) {
      const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      setConfirmRemove(null);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove player");
        return;
      }
      toast.success("Player removed!");
      const refetch = await fetch(`/api/tournaments/${tournamentId}`);
      if (refetch.ok) {
        const data = await refetch.json();
        setTournament(data.data.tournament);
        setEditTournament(data.data.tournament);
      }
    }
  };

  if (loading)
    return (
      <div className="flex flex-col gap-6 items-center w-full max-w-3xl mx-auto px-1 sm:px-2 md:px-4 lg:px-8">
        <Card className="w-full border-2 border-transparent bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:via-zinc-950 group shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="flex-1">
              <CardTitle>
                <Skeleton className="h-7 w-40 mb-2" />
              </CardTitle>
            </div>
            <Skeleton className="w-5 h-5 mr-1" />
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            <div className="flex items-center gap-2 text-sm">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-64 mt-2" />
            <div>
              <Skeleton className="h-6 w-40 mt-4 mb-2" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-28 ml-6" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  if (!tournament)
    return <div className="p-8 text-destructive">Tournament not found</div>;

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-3xl mx-auto px-1 sm:px-2 md:px-4 lg:px-8">
      <Card className="w-full border-2 border-transparent hover:border-primary/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:via-zinc-950 group shadow-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-2xl truncate max-w-full">
            {editMode && isAdmin ? (
              <Input
                value={editTournament?.name || ""}
                onChange={(e) =>
                  setEditTournament(
                    (et) => et && { ...et, name: e.target.value }
                  )
                }
                className="mb-2"
              />
            ) : (
              tournament.name
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4" role="img" aria-label="calendar">
                📅
              </span>
              {editMode && isAdmin ? (
                <Input
                  type="date"
                  value={editTournament?.date.slice(0, 10) || ""}
                  onChange={(e) =>
                    setEditTournament(
                      (et) => et && { ...et, date: e.target.value }
                    )
                  }
                  className="mb-2 max-w-xs"
                />
              ) : (
                <span className="truncate">
                  {new Date(tournament.date).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4" role="img" aria-label="location">
                📍
              </span>
              {editMode && isAdmin ? (
                <Input
                  value={editTournament?.location || ""}
                  onChange={(e) =>
                    setEditTournament(
                      (et) => et && { ...et, location: e.target.value }
                    )
                  }
                  className="mb-2 max-w-xs"
                />
              ) : (
                <span className="truncate">{tournament.location}</span>
              )}
            </div>
            {editMode && isAdmin ? (
              <Input
                value={editTournament?.description || ""}
                onChange={(e) =>
                  setEditTournament(
                    (et) => et && { ...et, description: e.target.value }
                  )
                }
                className="mb-4 max-w-full"
                placeholder="Description (optional)"
              />
            ) : (
              tournament.description && (
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 text-sm mt-1">
                  <span
                    className="w-4 h-4 flex-shrink-0"
                    role="img"
                    aria-label="description"
                  >
                    📝
                  </span>
                  <span className="truncate">{tournament.description}</span>
                </div>
              )
            )}
          </div>
          <div>
            <h3 className="font-semibold mt-4 mb-2 text-base md:text-lg">
              Players in this tournament:
            </h3>
            <div className="overflow-x-auto w-full">
              <table className="min-w-[600px] w-full border rounded text-sm md:text-base">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Place</th>
                    <th className="px-2 py-1 text-left">Points</th>
                    <th className="px-2 py-1 text-left">Bounty</th>
                    <th className="px-2 py-1 text-left">ReEntries</th>
                    {isAdmin && <th className="px-2 py-1"></th>}
                  </tr>
                </thead>
                <tbody>
                  {tournament && Array.isArray(tournament.players) && tournament.players.length === 0 && (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-2 py-6 text-center bg-zinc-50 dark:bg-zinc-900"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span role="img" aria-label="No players" className="text-4xl mb-1">🃏</span>
                          <span className="text-muted-foreground font-medium">No players yet</span>
                          {isAdmin && (
                            <span className="text-xs text-muted-foreground">Use the Add Player button above to invite participants!</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {tournament && Array.isArray(tournament.players) && tournament.players.length > 0 &&
  [...tournament.players]
    .sort((a, b) => {
      if (typeof a.rank === 'number' && typeof b.rank === 'number') return a.rank - b.rank;
      if (typeof a.rank === 'number') return -1;
      if (typeof b.rank === 'number') return 1;
      return 0;
    })
    .map((p) => (
      <PlayerRow
        key={p.id}
        player={p}
        tournament={tournament}
        tournamentId={tournament.id}
        isAdmin={isAdmin}
        onPlayerUpdated={(updatedPlayer) => {
          setTournament((prev) => {
            if (!prev || !Array.isArray(prev.players)) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
              ),
            };
          });
          setEditTournament((prev) => {
            if (!prev || !Array.isArray(prev.players)) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
              ),
            };
          });
        }}
        onRequestRemove={setConfirmRemove}
      />
    ))}
                  {/* Summary Row */}
                  {tournament && Array.isArray(tournament.players) && tournament.players.length > 0 && (
                    <tr className="font-bold bg-muted/60">
                      <td className="px-2 py-1">Total</td>
                      <td className="px-2 py-1">—</td>
                      <td className="px-2 py-1">
                        {tournament.players.reduce(
                          (sum, p) => sum + (p.points ?? 0),
                          0
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {tournament.players.reduce(
                          (sum, p) => sum + (p.bounty ?? 0),
                          0
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {tournament.players.reduce(
                          (sum, p) => sum + (p.reentries ?? 0),
                          0
                        )}
                      </td>
                      {isAdmin && <td></td>}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end mb-4 w-full mt-4">
                <div className="flex-1 min-w-0">
                  <PlayerAutocomplete
                    options={Array.isArray(allPlayers) && Array.isArray(tournament?.players)
                      ? allPlayers.filter(
                          (p) => !tournament.players.some((tp) => tp.id === p.id)
                        )
                      : []}
                    value={addPlayerIds}
                    onChange={setAddPlayerIds}
                    disabled={addingPlayer}
                    loading={false}
                  />
                </div>
                <Button
                  onClick={handleAddPlayer}
                  disabled={addPlayerIds.length === 0 || addingPlayer}
                  size="sm"
                  className="h-10 md:h-8 w-full sm:w-auto"
                >
                  {addingPlayer ? "Adding..." : "Add Players"}
                </Button>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {editMode ? (
                <>
                  <Button
                    onClick={handleEditSave}
                    disabled={saving}
                    className="h-10 md:h-8"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditTournament(tournament);
                    }}
                    className="h-10 md:h-8"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="h-10 md:h-8"
                >
                  Edit Tournament Info
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Remove confirmation dialog */}
      <Dialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Player?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this player from the tournament?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmRemove) {
                  await handleRemovePlayer(confirmRemove);
                  setConfirmRemove(null);
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PlayerRowProps {
  player: Player;
  tournamentId: string;
  isAdmin: boolean;
  onPlayerUpdated: (updatedPlayer: Player) => void;
  onRequestRemove: (playerId: string) => void;
}

interface PlayerRowProps {
  player: Player;
  tournament: Tournament;
  tournamentId: string;
  isAdmin: boolean;
  onPlayerUpdated: (updatedPlayer: Player) => void;
  onRequestRemove: (playerId: string) => void;
}

const PlayerRow = React.memo(function PlayerRow({
  player,
  tournament,
  tournamentId,
  isAdmin,
  onPlayerUpdated,
  onRequestRemove,
}: PlayerRowProps) {
  const [edit, setEdit] = React.useState(false);
  const [rank, setRank] = React.useState<number | "">(player.rank ?? "");
  const [points, setPoints] = React.useState<number | "">(player.points ?? "");
  const [bounty, setBounty] = React.useState<number | "">(player.bounty ?? "");
  const [reentries, setReentries] = React.useState<number | "">(
    player.reentries ?? ""
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setRank(player.rank ?? "");
    setPoints(player.points ?? "");
    setBounty(player.bounty ?? "");
    setReentries(player.reentries ?? "");
  }, [player.rank, player.points, player.bounty, player.reentries]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        rank: rank === "" ? undefined : Number(rank),
        points: points === "" ? undefined : Number(points),
        bounty: bounty === "" ? undefined : Number(bounty),
        reentries: reentries === "" ? undefined : Number(reentries),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to update player");
      return;
    }
    toast.success("Player updated");
    setEdit(false);
    onPlayerUpdated({
      ...player,
      rank: rank === "" ? undefined : Number(rank),
      points: points === "" ? undefined : Number(points),
      bounty: bounty === "" ? undefined : Number(bounty),
      reentries: reentries === "" ? undefined : Number(reentries),
    });
  };

  // Highlight special places (1st, 2nd, 3rd)
  let highlight = "";
  if (player.rank === 1)
    highlight = "bg-yellow-100 dark:bg-yellow-900/40 font-bold";
  else if (player.rank === 2)
    highlight = "bg-gray-100 dark:bg-gray-800 font-semibold";
  else if (player.rank === 3)
    highlight = "bg-orange-100 dark:bg-orange-900/40 font-semibold";

  if (!isAdmin) {
    return (
      <tr className={highlight + " border-b last:border-b-0"}>
        <td className="px-2 py-1 truncate max-w-[120px] md:max-w-[220px]">
          {player.name}
        </td>
        <td className="px-2 py-1">{player.rank ?? "-"}</td>
        <td className="px-2 py-1">{player.points ?? "-"}</td>
        <td className="px-2 py-1">{player.bounty ?? "-"}</td>
        <td className="px-2 py-1">{player.reentries ?? "-"}</td>
        <td className="px-2 py-1">
          {typeof tournament?.buyin === 'number' && typeof tournament?.rebuy === 'number' && typeof player.reentries === 'number'
            ? (tournament.buyin + player.reentries * tournament.rebuy)
            : '-'}
        </td>
      </tr>
    );
  }

  return (
    <tr className={highlight + " border-b last:border-b-0"}>
      <td className="px-2 py-1 truncate max-w-[120px] md:max-w-[220px] align-middle">
        {player.name}
      </td>
      <td className="px-2 py-1 align-middle">
        {edit ? (
          <Input
            value={rank}
            onChange={(e) => setRank(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-16"
            type="number"
            min={1}
          />
        ) : (
          player.rank ?? "-"
        )}
      </td>
      <td className="px-2 py-1 align-middle">
        {edit ? (
          <Input
            value={points}
            onChange={(e) => setPoints(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-20"
          />
        ) : (
          player.points ?? "-"
        )}
      </td>
      <td className="px-2 py-1 align-middle">
        {edit ? (
          <Input
            value={bounty}
            onChange={(e) => setBounty(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-20"
            min={0}
          />
        ) : (
          player.bounty ?? "-"
        )}
      </td>
      <td className="px-2 py-1 align-middle">
        {edit ? (
          <Input
            value={reentries}
            onChange={(e) => setReentries(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-20"
            min={0}
          />
        ) : (
          player.reentries ?? "-"
        )}
      </td>
      <td className="px-2 py-1 align-middle">
        {typeof tournament.buyin === 'number' && typeof tournament.rebuy === 'number' && typeof player.reentries === 'number'
          ? (tournament.buyin + player.reentries * tournament.rebuy)
          : '-'}
      </td>
      <td className="px-2 py-1 align-middle">
  <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">

        {edit ? (
          <Button
            size="sm"
            aria-label="Save player changes"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto h-9 px-4 font-medium"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        ) : (
          <Button
            size="sm"
            aria-label="Save player changes"
            variant="outline"
            onClick={() => setEdit(true)}
            className="w-full sm:w-auto h-9 px-4 font-medium"
          >
            Edit
          </Button>
        )}
        {edit && (
          <Button
            size="sm"
            aria-label="Save player changes"
            variant="ghost"
            onClick={() => {
              setEdit(false);
              setRank(player.rank ?? "");
              setPoints(player.points ?? "");
              setBounty(player.bounty ?? "");
              setReentries(player.reentries ?? "");
            }}
            className="w-full sm:w-auto h-9 px-4 font-medium"
          >
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          aria-label="Remove player"
          onClick={() => onRequestRemove(player.id)}
          className="w-full sm:w-auto h-9 px-4 font-medium"
        >
          Remove
        </Button>
      </div>
      </td>
    </tr>
  );
});


