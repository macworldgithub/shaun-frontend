import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';

export default function PaginationControls({ page, pageCount, total, pageSize, onPageChange }) {
  const [jumpPage, setJumpPage] = useState('');

  useEffect(() => {
    if (pageCount > 0 && page > pageCount) onPageChange(pageCount);
  }, [page, pageCount, onPageChange]);

  useEffect(() => {
    setJumpPage(String(page));
  }, [page]);

  if (pageCount <= 1) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  // Generate windowed page numbers with ellipsis
  const getPageItems = () => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => ({
        type: 'page',
        value: index + 1,
      }));
    }

    const items = [];

    if (page <= 4) {
      for (let i = 1; i <= 5; i++) {
        items.push({ type: 'page', value: i });
      }
      items.push({ type: 'ellipsis', value: 'ellipsis-end', jumpTo: Math.min(pageCount, page + 5) });
      items.push({ type: 'page', value: pageCount });
    } else if (page >= pageCount - 3) {
      items.push({ type: 'page', value: 1 });
      items.push({ type: 'ellipsis', value: 'ellipsis-start', jumpTo: Math.max(1, page - 5) });
      for (let i = pageCount - 4; i <= pageCount; i++) {
        items.push({ type: 'page', value: i });
      }
    } else {
      items.push({ type: 'page', value: 1 });
      items.push({ type: 'ellipsis', value: 'ellipsis-start', jumpTo: Math.max(1, page - 5) });
      items.push({ type: 'page', value: page - 1 });
      items.push({ type: 'page', value: page });
      items.push({ type: 'page', value: page + 1 });
      items.push({ type: 'ellipsis', value: 'ellipsis-end', jumpTo: Math.min(pageCount, page + 5) });
      items.push({ type: 'page', value: pageCount });
    }

    return items;
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(jumpPage, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount && parsed !== page) {
      onPageChange(parsed);
    } else {
      setJumpPage(String(page));
    }
  };

  const pageItems = getPageItems();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500 sm:px-6">
      <span className="font-medium whitespace-nowrap">
        {firstItem.toLocaleString()}–{lastItem.toLocaleString()} of {total.toLocaleString()}
      </span>

      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* First page button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
          aria-label="First page"
          title="First page"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
          aria-label="Previous page"
          title="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Desktop Page Numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageItems.map((item) => {
            if (item.type === 'ellipsis') {
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                  aria-label={`Jump to page ${item.jumpTo}`}
                  title={`Jump to page ${item.jumpTo}`}
                  onClick={() => onPageChange(item.jumpTo)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              );
            }

            const isCurrent = item.value === page;
            return (
              <Button
                key={item.value}
                type="button"
                variant={isCurrent ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 text-xs font-medium ${
                  isCurrent ? 'shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                }`}
                aria-label={`Go to page ${item.value}`}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageChange(item.value)}
              >
                {item.value}
              </Button>
            );
          })}
        </div>

        {/* Mobile Page indicator */}
        <span className="px-2 font-medium text-neutral-700 sm:hidden">
          Page {page} of {pageCount}
        </span>

        {/* Next page button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
          aria-label="Next page"
          title="Next page"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
          aria-label="Last page"
          title="Last page"
          disabled={page === pageCount}
          onClick={() => onPageChange(pageCount)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {/* Quick jump to page input for large lists */}
        {pageCount > 7 && (
          <form onSubmit={handleJumpSubmit} className="hidden items-center gap-1.5 pl-2 ml-1 border-l border-neutral-200 md:flex">
            <span className="text-[11px] text-neutral-500 whitespace-nowrap">Go to:</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onBlur={handleJumpSubmit}
              className="h-8 w-12 rounded-md border border-neutral-300 bg-white px-1 text-center text-xs text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              aria-label="Jump to page number"
            />
          </form>
        )}
      </div>
    </div>
  );
}

