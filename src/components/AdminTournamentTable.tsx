import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScoreboardPagination } from "@/components/Scoreboard/ScoreboardPagination";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tournament = {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string | null;
  buyin?: number;
  rebuy?: number;
};

const AdminTournamentTable = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentDate, setNewTournamentDate] = useState("");
  const [newTournamentLocation, setNewTournamentLocation] = useState("");
  const [newTournamentDescription, setNewTournamentDescription] = useState("");
  const [newTournamentBuyin, setNewTournamentBuyin] = useState(0);
  const [newTournamentRebuy, setNewTournamentRebuy] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prevTournaments, setPrevTournaments] = useState<Tournament[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = tournaments.length > 0 && selectedIds.length === tournaments.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : tournaments.map(t => t.id));
  const toggleSelect = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tournaments?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        { cache: 'no-store' }
      );
      const result = await res.json();
      console.log("[AdminTournamentTable] Received response:", result);
      if (result.success && result.data) {
        console.log("[AdminTournamentTable] Setting tournaments:", result.data.tournaments);
        setTournaments(result.data.tournaments || []);
        setPage(result.data.page || 1);
        setTotalPages(result.data.totalPages || 1);
        setTotal(result.data.total || (result.data.tournaments?.length || 0) * (result.data.totalPages || 1));
      } else {
        console.log("[AdminTournamentTable] No tournaments found or error:", result);
        setTournaments([]);
        setPage(1);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (error) {
      console.error("[AdminTournamentTable] Error fetching tournaments:", error);
      setTournaments([]);
      setPage(1);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const openEditDialog = (t: Tournament) => setEditTournament(t);
  const closeEditDialog = () => setEditTournament(null);

  const handleEditSave = async () => {
    if (!editTournament) return;
    setEditLoading(true);
    setPrevTournaments(tournaments);
    try {
      const res = await fetch(`/api/tournaments/${editTournament.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTournament.name,
          date: editTournament.date,
          location: editTournament.location,
          description: editTournament.description,
          buyin: editTournament.buyin,
          rebuy: editTournament.rebuy,
        }),
      });
      if (!res.ok) {
        setTournaments(prevTournaments);
        setEditLoading(false);
        return;
      }
      toast.success("Tournament updated!");
      closeEditDialog();
      setLoading(true);
      setTournaments([]);
      const response = await fetch(`/api/tournaments?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}&_=${Date.now()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setTournaments(result.data.tournaments || []);
        setPage(result.data.page || 1);
        setTotalPages(result.data.totalPages || 1);
        setTotal(result.data.total || (result.data.tournaments?.length || 0) * (result.data.totalPages || 1));
      } else {
        setTournaments([]);
        setPage(1);
        setTotalPages(1);
        setTotal(0);
      }
      setLoading(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    setDeleteLoadingId(id);
    setPrevTournaments(tournaments);
    setTournaments(tournaments.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setTournaments(prevTournaments);
        setDeleteLoadingId(null);
        return;
      }
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newTournamentName.trim() || !newTournamentDate.trim() || !newTournamentLocation.trim()) {
      setCreateError("Please fill in all required fields");
      return;
    }
    setCreateLoading(true);
    const optimisticTournament = {
      id: 'temp-' + Date.now(),
      name: newTournamentName,
      date: newTournamentDate,
      location: newTournamentLocation,
      description: newTournamentDescription,
      buyin: Number(newTournamentBuyin) || 0,
      rebuy: Number(newTournamentRebuy) || 0,
    };
    setPrevTournaments(tournaments);
    setTournaments([optimisticTournament, ...tournaments]);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTournamentName,
          date: newTournamentDate,
          location: newTournamentLocation,
          description: newTournamentDescription,
          buyin: Number(newTournamentBuyin) || 0,
          rebuy: Number(newTournamentRebuy) || 0,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setTournaments(prevTournaments); // Rollback optimistic update
        setCreateError(data.error || "Failed to add tournament");
        return;
      }

      const tournament = data?.data?.tournament;
      if (tournament && tournament.id) {
        setTournaments(prev => [tournament, ...prev.filter(t => t.id !== optimisticTournament.id)]);
        setNewTournamentName("");
        setNewTournamentDate("");
        setNewTournamentLocation("");
        setNewTournamentDescription("");
        setNewTournamentBuyin(1000);
        setNewTournamentRebuy(1000);
        // Force a fresh fetch after successful creation
        await fetchTournaments();
      }
    } catch (error) {
      setTournaments(prevTournaments); // Rollback optimistic update
      setCreateError("Failed to add tournament. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <Card className="w-full mb-8 shadow-lg border border-muted-foreground/10 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Create Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTournament} className="flex flex-col sm:flex-row gap-2 items-stretch w-full">
            <Input
              placeholder="Name"
              value={newTournamentName ?? ""}
              onChange={e => setNewTournamentName(e.target.value)}
              required
              aria-label="Tournament Name"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Date (YYYY-MM-DD)"
              type="date"
              value={newTournamentDate ?? ""}
              onChange={e => setNewTournamentDate(e.target.value)}
              required
              aria-label="Tournament Date"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Location"
              value={newTournamentLocation ?? ""}
              onChange={e => setNewTournamentLocation(e.target.value)}
              required
              aria-label="Tournament Location"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Description (optional)"
              value={newTournamentDescription ?? ""}
              onChange={e => setNewTournamentDescription(e.target.value)}
              aria-label="Tournament Description"
              className="flex-1 min-w-0"
            />
            <Button
              type="submit"
              disabled={createLoading}
              className="w-full sm:w-auto"
            >
              {createLoading ? "Adding..." : "Add Tournament"}
            </Button>
          </form>
          {createError && <div className="text-destructive text-sm mt-2">{createError}</div>}
        </CardContent>
      </Card>
      <div className="space-y-4 w-full">
        <div className="flex items-center gap-2 pl-6 py-1 mb-2">
          {tournaments.length > 0 && (
            <>
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all tournaments" id="select-all-tournaments" />
              <label htmlFor="select-all-tournaments" className="text-sm cursor-pointer select-none">Select All</label>
              {selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); setConfirmBulkDelete(true); }}>
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
            </>
          )}
          <Input
            placeholder="Search tournaments by name or location..."
            value={search ?? ""}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto max-w-xs"
            aria-label="Search tournaments"
          />
        </div>
        <div>
          {loading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
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
              ))}
            </div>
          ) : (
            tournaments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {tournaments.map((t) => (
                  <Card
                    key={t.id}
                    className={cn(
                      // Match player card gradient, border, and hover
                      "w-full cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:via-zinc-950 group",
                      selectedIds.includes(t.id) ? "ring-2 ring-primary/40 bg-primary/5" : ""
                    )}
                    tabIndex={0}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('button, [data-slot=\"checkbox\"]')) return;
                      toggleSelect(t.id);
                    }}
                  >
                    <CardContent className="flex flex-row items-center gap-4 pt-4 pb-4">
                      <Checkbox
                        checked={selectedIds.includes(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                        aria-label={`Select tournament ${t.name}`}
                        className="size-5 flex-shrink-0"
                        id={`tournament-checkbox-${t.id}`}
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-4 pb-2">
                          <div className="flex-1">
                            <span className="text-xl font-semibold group-hover:text-primary transition-colors truncate">
                              {t.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-4 h-4" role="img" aria-label="location">📍</span>
                          <span className="truncate">{t.location || '-'}</span>
                        </div>
                        {t.description && (
                          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 text-sm mt-1">
                            <span className="w-4 h-4 flex-shrink0" role="img" aria-label="description">📝</span>
                            <span className="truncate">{t.description}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-4 h-4" role="img" aria-label="date">📅</span>
                          <span className="truncate">
                            {t.date && !isNaN(new Date(t.date).getTime())
                              ? new Date(t.date).toISOString().slice(0, 10)
                              : "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4 w-28 max-w-[120px] justify-center">
                        <Button
                          onClick={e => {
                            e.stopPropagation();
                            openEditDialog(t);
                          }}
                          className="w-full px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:outline-none hover:bg-primary/90 active:scale-95"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDeleteId(t.id);
                          }}
                          className="w-full px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-destructive/70 focus-visible:outline-none hover:bg-destructive/90 active:scale-95"
                          disabled={deleteLoadingId === t.id}
                        >
                          {deleteLoadingId === t.id ? (
                            <Skeleton className="h-5 w-14" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span
                  className="text-6xl mb-4 select-none"
                  role="img"
                  aria-label="No tournaments"
                >
                  🏆
                </span>
                <div className="text-xl font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
                  No tournaments found
                </div>
                <div className="text-md text-zinc-500 dark:text-zinc-400 max-w-md">
                  There are currently no tournaments. Please check back later or create a new one above.
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <ScoreboardPagination
        total={total}
        page={page}
        perPage={20}
        onPageChange={setPage}
        loading={loading}
      />
      {/* Bulk Delete Confirmation Dialog */}
      {confirmBulkDelete && (
        <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Selected Tournaments?</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-center">
              <span className="text-4xl select-none" role="img" aria-label="Warning">⚠️</span>
              <div className="mt-2 mb-1 text-lg font-semibold">Are you sure?</div>
              <div className="text-zinc-600 dark:text-zinc-300 mb-2">
                This will permanently delete <span className="font-bold">{selectedIds.length}</span> tournament{selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmBulkDelete(false)} autoFocus aria-label="Cancel bulk delete">
                Cancel
              </Button>
              <Button
                variant="destructive"
                aria-label="Confirm bulk delete tournaments"
                disabled={loading}
                onClick={async () => {
                  setConfirmBulkDelete(false);
                  setLoading(true);
                  const prev = tournaments;
                  setTournaments(tournaments.filter(t => !selectedIds.includes(t.id)));
                  setSelectedIds([]);
                  try {
                    await Promise.all(selectedIds.map(id => fetch(`/api/tournaments/${id}`, { method: 'DELETE' })));
                    toast.success('Selected tournaments deleted');
                  } catch {
                    setTournaments(prev);
                    toast.error('Failed to delete one or more tournaments');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? <Skeleton className="h-5 w-14" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Edit Dialog */}
      {editTournament && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 px-2">
          <div className="bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-6 w-full max-w-md mx-auto transition-colors duration-200">
            <h2 className="text-lg font-bold mb-2">Edit Tournament</h2>
            <Input
              className="mb-2"
              placeholder="Tournament Name"
              value={editTournament.name ?? ""}
              onChange={(e) =>
                setEditTournament({ ...editTournament, name: e.target.value })
              }
              disabled={editLoading}
            />
            <Input
              className="mb-2"
              type="date"
              placeholder="Date"
              value={editTournament.date?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setEditTournament({ ...editTournament, date: e.target.value })
              }
              disabled={editLoading}
            />
            <Input
              className="mb-2"
              placeholder="Location"
              value={editTournament.location ?? ""}
              onChange={(e) =>
                setEditTournament({ ...editTournament, location: e.target.value })
              }
              disabled={editLoading}
            />
            <Input
              className="mb-2"
              type="number"
              min={0}
              placeholder="Buy-in (₽)"
              value={editTournament.buyin ?? 0}
              onChange={e => setEditTournament({ ...editTournament, buyin: Number(e.target.value) })}
              disabled={editLoading}
            />
            <Input
              className="mb-2"
              type="number"
              min={0}
              placeholder="Rebuy (₽)"
              value={editTournament.rebuy ?? 0}
              onChange={e => setEditTournament({ ...editTournament, rebuy: Number(e.target.value) })}
              disabled={editLoading}
            />
            <Input
              className="mb-4"
              placeholder="Description (optional)"
              value={editTournament.description ?? ""}
              onChange={(e) =>
                setEditTournament({ ...editTournament, description: e.target.value })
              }
              disabled={editLoading}
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await handleEditSave();
                  toast.success('Tournament updated');
                }}
                disabled={editLoading}
                aria-label="Save tournament changes"
              >
                {editLoading ? <Skeleton className="h-5 w-20" /> : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={closeEditDialog}
                disabled={editLoading}
                aria-label="Cancel edit tournament"
                autoFocus
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
            <DialogTitle>Delete Tournament?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this tournament? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} autoFocus aria-label="Cancel delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              aria-label="Confirm delete tournament"
              disabled={!!deleteLoadingId}
              onClick={async () => {
                if (confirmDeleteId) {
                  await handleDeleteTournament(confirmDeleteId);
                  toast.success('Tournament deleted');
                }
                setConfirmDeleteId(null);
              }}
            >
              {deleteLoadingId ? <Skeleton className="h-5 w-14" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminTournamentTable; 