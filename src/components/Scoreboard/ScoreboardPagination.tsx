"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";

interface PaginationProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export function ScoreboardPagination({ total, page, perPage, onPageChange, loading }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  if (loading) {
    return <Skeleton className="h-8 w-32 rounded mx-auto" />;
  }
  if (totalPages <= 1) return null;
  return (
    <div className="flex gap-2 justify-center mt-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous Page">Prev</Button>
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
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next Page">Next</Button>
    </div>
  );
}
