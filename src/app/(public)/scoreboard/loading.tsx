import { Skeleton } from "@/components/ui/Skeleton";

export default function LoadingScoreboardPage() {
  return (
    <div className="container mx-auto px-2 py-8">
      <Skeleton className="h-8 w-48 mb-4 rounded" />
      <Skeleton className="h-6 w-32 mb-2 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
