import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreboardPagination } from "@/components/Scoreboard/ScoreboardPagination";
import { Skeleton } from "@/components/ui/Skeleton";

const ACTIONS = ["CREATE", "UPDATE", "DELETE"];
const ENTITY_TYPES = ["Player", "Tournament"];

function debounce(fn: (...args: any[]) => void, ms: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function AuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [debouncedUserFilter, setDebouncedUserFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const handler = debounce((val: string) => setDebouncedUserFilter(val), 300);
    handler(userFilter);
    return () => clearTimeout((handler as any).timeout);
  }, [userFilter]);

  useEffect(() => {
    setPage(1);
  }, [action, entityType]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    fetch(`/api/admin/audit-logs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, action, entityType]);

  const filteredLogs = debouncedUserFilter
    ? logs.filter(log => {
        const user = log.user;
        const val = debouncedUserFilter.toLowerCase();
        return (
          (user?.name && user.name.toLowerCase().includes(val)) ||
          (user?.email && user.email.toLowerCase().includes(val)) ||
          (log.userId && log.userId.toLowerCase().includes(val))
        );
      })
    : logs;
  const dateFilteredLogs = filteredLogs.filter(log => {
    if (startDate && new Date(log.createdAt) < new Date(startDate)) return false;
    if (endDate && new Date(log.createdAt) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  // Expandable details state
  const [expandedDetails, setExpandedDetails] = useState<{ [id: string]: boolean }>({});

  function toggleDetails(id: string) {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function renderUserCell(log: any) {
  if (log.user?.name || log.user?.email) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/80 text-white font-bold">
          {log.user.name ? log.user.name[0].toUpperCase() : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a7.5 7.5 0 0 1 13 0" /></svg>}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-foreground truncate max-w-[140px]" title={log.user.name}>{log.user.name}</span>
          {log.user.email && (
            <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={log.user.email}>{log.user.email}</span>
          )}
        </div>
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a7.5 7.5 0 0 1 13 0" /></svg>
      {log.userId}
    </span>
  );
}

  function badge(text: string, color: string) {
  // Use higher-contrast Tailwind colors for dark mode
  const colorMap: Record<string, string> = {
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
    gray: 'bg-gray-500 text-white',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colorMap[color] || colorMap.gray}`}
      aria-label={text}
    >
      {text}
    </span>
  );
}

  function actionBadge(action: string) {
    if (action === "CREATE") return badge("CREATE", "green");
    if (action === "UPDATE") return badge("UPDATE", "yellow");
    if (action === "DELETE") return badge("DELETE", "red");
    return badge(action, "gray");
  }
  function entityBadge(entity: string) {
    if (entity === "Player") return badge("Player", "blue");
    if (entity === "Tournament") return badge("Tournament", "purple");
    return badge(entity, "gray");
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:flex-wrap gap-2 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Action</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="border rounded px-2 py-1 min-w-[120px]"
          >
            <option value="">All</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Entity Type</label>
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            className="border rounded px-2 py-1 min-w-[120px]"
          >
            <option value="">All</option>
            {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">User (name/email/id)</label>
          <Input
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="border rounded px-2 py-1 min-w-[180px]"
            placeholder="Search admin..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded px-2 py-1 min-w-[120px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 min-w-[120px]"
          />
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0"
          onClick={() => {
            setAction("");
            setEntityType("");
            setUserFilter("");
            setStartDate("");
            setEndDate("");
          }}
        >
          Clear Filters
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-6 w-full rounded" /></TableCell>
                </TableRow>
              ))
            ) : dateFilteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No audit logs found.</TableCell>
              </TableRow>
            ) : (
              dateFilteredLogs.map((log, idx) => {
                const isExpanded = !!expandedDetails[log.id];
                const detailsStr = JSON.stringify(log.details, null, 2);
                const truncated = detailsStr.length > 300;
                return (
                  <TableRow
                    key={log.id}
                    className={
                      idx % 2 === 0
                        ? "bg-background hover:bg-accent/40 focus-within:bg-accent/60"
                        : "bg-muted/50 hover:bg-accent/40 focus-within:bg-accent/60"
                    }
                    tabIndex={0}
                  >
                    <TableCell>{renderUserCell(log)}</TableCell>
                    <TableCell>{actionBadge(log.action)}</TableCell>
                    <TableCell>{entityBadge(log.entityType)}</TableCell>
                    <TableCell className="break-all whitespace-pre-wrap max-w-[240px] relative group" title={log.entityId}>
  <span>{log.entityId}</span>
  <button
    className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-xs text-primary underline focus:outline-none"
    aria-label="Copy Entity ID"
    onClick={() => {
      navigator.clipboard.writeText(log.entityId);
    }}
    tabIndex={0}
    title="Copy Entity ID"
  >
    Copy
  </button>
</TableCell>
                    <TableCell title={new Date(log.createdAt).toLocaleString()}>
                      {getRelativeTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="truncate max-w-[320px]">
                      <div className="flex flex-col gap-1">
                        <pre className="whitespace-pre-wrap text-xs max-w-[320px] overflow-x-auto" title={detailsStr}>
                          {isExpanded ? detailsStr : detailsStr.slice(0, 300)}{truncated && !isExpanded ? "..." : ""}
                        </pre>
                        {truncated && (
                          <Button variant="link" size="sm" className="px-0 h-5 text-xs" onClick={() => toggleDetails(log.id)}>
                            {isExpanded ? "Show less" : "Show more"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <ScoreboardPagination
        total={total}
        page={page}
        perPage={20}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
} 