"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";

interface PaginationProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function ScoreboardPagination({
  total,
  page,
  perPage,
  onPageChange,
  loading,
}: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  const isMobile = useIsMobile();
  if (loading) {
    return <Skeleton className="h-8 w-32 rounded mx-auto" />;
  }
  if (totalPages <= 1) return null;

  // Adaptive rendering
  if (isMobile) {
    return (
      <div className="flex gap-2 justify-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous Page"
        >
          Prev
        </Button>
        <span className="px-2 py-1 text-sm rounded border bg-muted select-none">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next Page"
        >
          Next
        </Button>
      </div>
    );
  }
  // Desktop: show all page numbers
  return (
    <div className="flex gap-2 justify-center mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous Page"
      >
        Prev
      </Button>
      {Array.from({ length: totalPages }, (_, i) => (
        <Button
          key={i + 1}
          variant={page === i + 1 ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i + 1)}
          aria-label={`Go to page ${i + 1}`}
        >
          {i + 1}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next Page"
      >
        Next
      </Button>
    </div>
  );
}
