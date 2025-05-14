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

type Tournament = {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string | null;
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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tournaments?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        setTournaments(data.tournaments || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || (data.tournaments?.length || 0) * (data.totalPages || 1));
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  const openEditDialog = (t: Tournament) => setEditTournament(t);
  const closeEditDialog = () => setEditTournament(null);

  const handleEditSave = async () => {
    if (!editTournament) return;
    setEditLoading(true);
    setPrevTournaments(tournaments);
    setTournaments(
      tournaments.map((t) =>
        t.id === editTournament.id
          ? { ...t, name: editTournament.name, date: editTournament.date, location: editTournament.location, description: editTournament.description }
          : t
      )
    );
    try {
      const res = await fetch(`/api/tournaments/${editTournament.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTournament.name,
          date: editTournament.date,
          location: editTournament.location,
          description: editTournament.description,
        }),
      });
      if (!res.ok) {
        setTournaments(prevTournaments);
        setEditLoading(false);
        return;
      }
      const { tournament } = await res.json();
      setTournaments(
        tournaments.map((t) =>
          t.id === tournament.id
            ? { ...t, name: tournament.name, date: tournament.date, location: tournament.location, description: tournament.description }
            : t
        )
      );
      closeEditDialog();
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
      id: `temp-${Date.now()}`,
      name: newTournamentName,
      date: newTournamentDate,
      location: newTournamentLocation,
      description: newTournamentDescription,
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
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setCreateError(error || "Failed to add tournament");
        setCreateLoading(false);
        return;
      }
      const { tournament } = await res.json();
      setTournaments([tournament, ...tournaments]);
      setNewTournamentName("");
      setNewTournamentDate("");
      setNewTournamentLocation("");
      setNewTournamentDescription("");
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
              value={newTournamentName}
              onChange={e => setNewTournamentName(e.target.value)}
              required
              aria-label="Tournament Name"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Date (YYYY-MM-DD)"
              type="date"
              value={newTournamentDate}
              onChange={e => setNewTournamentDate(e.target.value)}
              required
              aria-label="Tournament Date"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Location"
              value={newTournamentLocation}
              onChange={e => setNewTournamentLocation(e.target.value)}
              required
              aria-label="Tournament Location"
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Description (optional)"
              value={newTournamentDescription}
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
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto max-w-xs"
            aria-label="Search tournaments"
          />
        </div>
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
          tournaments.map((t) => (
            <Card
              key={t.id}
              className={cn(
                "w-full cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:via-zinc-950 group",
                selectedIds.includes(t.id) ? "ring-2 ring-primary/40 bg-primary/5" : ""
              )}
              tabIndex={0}
              onClick={e => {
                if ((e.target as HTMLElement).closest('button, [data-slot="checkbox"]')) return;
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
          ))
        )}
        {!loading && tournaments.length === 0 && (
          <div className="text-center text-muted-foreground mt-8 text-base">
            No tournaments found.
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
      {editTournament && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 px-2">
          <div className="bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-6 w-full max-w-md mx-auto transition-colors duration-200">
            <h2 className="text-lg font-bold mb-2">Edit Tournament</h2>
            <Input
              className="mb-2"
              placeholder="Tournament Name"
              value={editTournament.name}
              onChange={(e) =>
                setEditTournament({ ...editTournament, name: e.target.value })
              }
              disabled={editLoading}
            />
            <Input
              className="mb-2"
              type="date"
              placeholder="Date"
              value={editTournament.date.slice(0, 10)}
              onChange={(e) =>
                setEditTournament({ ...editTournament, date: e.target.value })
              }
              disabled={editLoading}
            />
            <Input
              className="mb-2"
              placeholder="Location"
              value={editTournament.location}
              onChange={(e) =>
                setEditTournament({ ...editTournament, location: e.target.value })
              }
              disabled={editLoading}
            />
            <Input
              className="mb-4"
              placeholder="Description (optional)"
              value={editTournament.description || ""}
              onChange={(e) =>
                setEditTournament({ ...editTournament, description: e.target.value })
              }
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
            <DialogTitle>Delete Tournament?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this tournament? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) handleDeleteTournament(confirmDeleteId);
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
            <DialogTitle>Delete Selected Tournaments?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete {selectedIds.length} selected tournaments? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmBulkDelete(false);
                setPrevTournaments(tournaments);
                const toDelete = selectedIds;
                setTournaments(tournaments.filter(t => !toDelete.includes(t.id)));
                setSelectedIds([]);
                const failed: string[] = [];
                await Promise.all(toDelete.map(async id => {
                  const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
                  if (!res.ok) failed.push(id);
                }));
                if (failed.length) {
                  setTournaments(prevTournaments);
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
};

export default AdminTournamentTable; 