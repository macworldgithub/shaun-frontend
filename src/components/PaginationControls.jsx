import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

export default function PaginationControls({ page, pageCount, total, pageSize, onPageChange }) {
  useEffect(() => {
    if (pageCount > 0 && page > pageCount) onPageChange(pageCount);
  }, [page, pageCount, onPageChange]);

  if (pageCount <= 1) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500 sm:px-6">
      <span>{firstItem}-{lastItem} of {total}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === page ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              aria-label={`Go to page ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
        </div>
        <span className="px-2 sm:hidden">Page {page} of {pageCount}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
