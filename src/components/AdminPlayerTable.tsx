import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScoreboardPagination } from "@/components/Scoreboard/ScoreboardPagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PlayerWithDetails = {
  id: string;
  name: string;
  telegram: string;
  phone: string;
  createdAt: string;
};

export default function AdminPlayerTable() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editPlayer, setEditPlayer] = useState<PlayerWithDetails | null>(null);
  const [editName, setEditName] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTelegram, setNewPlayerTelegram] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prevPlayers, setPrevPlayers] = useState<PlayerWithDetails[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = players.length > 0 && selectedIds.length === players.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : players.map(p => p.id));
  const toggleSelect = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/players?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}&_=${Date.now()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setPlayers(result.data.players || []);
          setPage(result.data.page || 1);
          setTotalPages(result.data.totalPages || 1);
          setTotal(result.data.total || (result.data.players?.length || 0) * (result.data.totalPages || 1));
        } else {
          setPlayers([]);
          setPage(1);
          setTotalPages(1);
          setTotal(0);
        }
      })
      .finally(() => setLoading(false));
  }, [page, search]);

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
    setPrevPlayers(players);
    setPlayers(
      players.map((p) =>
        p.id === editPlayer.id
          ? { ...p, name: editName, telegram: editTelegram, phone: editPhone }
          : p
      )
    );
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
        setPlayers(prevPlayers);
        let errMsg = "Failed to update player";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        toast.error(errMsg);
        setEditLoading(false);
        return;
      }
      toast.success("Player updated!");
      closeEditDialog();
      setLoading(true);
      fetch(`/api/players?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}&_=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          setPlayers(data.players || []);
          setPage(data.page || 1);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || (data.players?.length || 0) * (data.totalPages || 1));
        })
        .finally(() => setLoading(false));
    } finally {
      setEditLoading(false);
    }
  };
  const handleDeletePlayer = async (playerId: string) => {
    setDeleteLoadingId(playerId);
    setPrevPlayers(players);
    setPlayers(players.filter((p) => p.id !== playerId));
    try {
      const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
      if (!res.ok) {
        setPlayers(prevPlayers);
        setDeleteLoadingId(null);
        return;
      }
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newPlayerName.trim()) {
      setCreateError("Please enter a name");
      return;
    }
    setCreateLoading(true);
    const optimisticPlayer = {
      id: `temp-${Date.now()}`,
      name: newPlayerName,
      telegram: newPlayerTelegram,
      phone: newPlayerPhone,
      createdAt: new Date().toISOString(),
    };
    setPrevPlayers(players);
    setPlayers([optimisticPlayer, ...players]);
    try {
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
        setCreateError(error || "Failed to add player");
        setPlayers(prevPlayers);
        setCreateLoading(false);
        return;
      }
      const { player } = await res.json();
      setPlayers([player, ...players.filter((p) => p.id !== optimisticPlayer.id)]);
      setNewPlayerName("");
      setNewPlayerTelegram("");
      setNewPlayerPhone("");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <Card className="w-full mb-8 shadow-lg border border-muted-foreground/10 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Create Player</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePlayer} className="flex flex-col sm:flex-row gap-2 items-stretch w-full">
            <Input
              placeholder="Name"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              required
              aria-label="Player Name"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Telegram Username"
              value={newPlayerTelegram}
              onChange={e => setNewPlayerTelegram(e.target.value)}
              aria-label="Telegram Username"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Phone"
              value={newPlayerPhone}
              onChange={e => setNewPlayerPhone(e.target.value)}
              aria-label="Phone"
              className="flex-1 min-w-0"
            />
            <Button
              type="submit"
              disabled={createLoading}
              className="w-full sm:w-auto"
            >
              {createLoading ? "Adding..." : "Add Player"}
            </Button>
          </form>
          {createError && <div className="text-destructive text-sm mt-2">{createError}</div>}
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 pl-6 py-1 mb-2">
        {players.length > 0 && (
          <>
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all players" id="select-all-players" />
            <label htmlFor="select-all-players" className="text-sm cursor-pointer select-none">Select All</label>
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); setConfirmBulkDelete(true); }}>
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </>
        )}
        <Input
          placeholder="Search players by name, telegram, or phone..."
          value={search ?? ""}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto max-w-xs"
          aria-label="Search players"
        />
      </div>
      <div className="space-y-4 w-full">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-36 mb-2 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          players.map((player) => (
            <Card
              key={player.id}
              className={cn(
                "w-full cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:via-zinc-950 group",
                selectedIds.includes(player.id) ? "ring-2 ring-primary/40 bg-primary/5" : ""
              )}
              tabIndex={0}
              onClick={e => {
                if ((e.target as HTMLElement).closest('button, [data-slot="checkbox"]')) return;
                toggleSelect(player.id);
              }}
            >
              <CardContent className="flex flex-row items-center gap-4 pt-4 pb-4">
                <Checkbox
                  checked={selectedIds.includes(player.id)}
                  onCheckedChange={() => {
                    toggleSelect(player.id);
                  }}
                  aria-label={`Select player ${player.name}`}
                  className="size-5 flex-shrink-0"
                />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-row items-center gap-4 pb-2">
                    <div className="flex-1">
                      <span className="text-xl font-semibold group-hover:text-primary transition-colors truncate">
                        {player.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4" role="img" aria-label="telegram">💬</span>
                    <span className="truncate">{player.telegram || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4" role="img" aria-label="phone">📞</span>
                    <span className="truncate">{player.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4" role="img" aria-label="date">📅</span>
                    <span className="truncate">
                      {player.createdAt && !isNaN(new Date(player.createdAt).getTime())
                        ? new Date(player.createdAt).toISOString().slice(0, 10)
                        : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4 w-28 max-w-[120px] justify-center">
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      openEditDialog(player);
                    }}
                    className="w-full px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:outline-none hover:bg-primary/90 active:scale-95"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={e => {
                      e.stopPropagation();
                      setConfirmDeleteId(player.id);
                    }}
                    className="w-full px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-destructive/70 focus-visible:outline-none hover:bg-destructive/90 active:scale-95"
                    disabled={deleteLoadingId === player.id}
                  >
                    {deleteLoadingId === player.id ? (
                      <Skeleton className="h-5 w-14" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {!loading && players.length === 0 && (
          <div className="text-center text-muted-foreground mt-8 text-base">
            No players found.
          </div>
        )}
      </div>
      <ScoreboardPagination
        total={total}
        page={page}
        perPage={20}
        onPageChange={setPage}
        loading={loading}
      />
      {/* Edit Dialog */}
      {editPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 px-2">
          <div className="bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-6 w-full max-w-md mx-auto transition-colors duration-200">
            <h2 className="text-lg font-bold mb-2">Edit Player</h2>
            <Input
              placeholder="Name"
              value={editName ?? ""}
              onChange={(e) => setEditName(e.target.value)}
              className="mb-2"
              disabled={editLoading}
            />
            <Input
              placeholder="Telegram Username (optional)"
              value={editTelegram ?? ""}
              onChange={(e) => setEditTelegram(e.target.value)}
              className="mb-2"
              disabled={editLoading}
            />
            <Input
              placeholder="Phone (optional)"
              value={editPhone ?? ""}
              onChange={(e) => setEditPhone(e.target.value)}
              className="mb-2"
              disabled={editLoading}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleEditSave}
                disabled={editLoading}
              >
                {editLoading ? <Skeleton className="h-5 w-20" /> : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={closeEditDialog}
                disabled={editLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={open => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this player? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) handleDeletePlayer(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={confirmBulkDelete} onOpenChange={open => !open && setConfirmBulkDelete(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Players?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete {selectedIds.length} selected players? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmBulkDelete(false);
                setPrevPlayers(players);
                const toDelete = selectedIds;
                setPlayers(players.filter(p => !toDelete.includes(p.id)));
                setSelectedIds([]);
                const failed: string[] = [];
                await Promise.all(toDelete.map(async id => {
                  const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
                  if (!res.ok) failed.push(id);
                }));
                if (failed.length) {
                  setPlayers(prevPlayers);
                  // Optionally: show a toast error
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 