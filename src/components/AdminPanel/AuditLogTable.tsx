import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreboardPagination } from "@/components/Scoreboard/ScoreboardPagination";
import { Skeleton } from "@/components/ui/Skeleton";

const ACTIONS = ["CREATE", "UPDATE", "DELETE"];
const ENTITY_TYPES = ["Player", "Tournament"];

export default function AuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");

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

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-end">
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
      </div>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
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
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No audit logs found.</TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{log.user?.name || log.user?.email || log.userId}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell className="truncate max-w-[180px]">{log.entityId}</TableCell>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="truncate max-w-[320px]">
                    <pre className="whitespace-pre-wrap text-xs max-w-[320px] overflow-x-auto">{JSON.stringify(log.details, null, 2).slice(0, 300)}{JSON.stringify(log.details, null, 2).length > 300 ? "..." : ""}</pre>
                  </TableCell>
                </TableRow>
              ))
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