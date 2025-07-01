import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from '@/hooks/use-media-query';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  siblingCount = 1
}: PaginationProps) {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const mobileSiblingCount = 0;
  const effectiveSiblingCount = isMobile ? mobileSiblingCount : siblingCount;
  
  // Generate page numbers to show
  const generatePagination = () => {
    // Always show first page
    const pagination: (number | 'ellipsis')[] = [1];
    
    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(2, currentPage - effectiveSiblingCount);
    const rightSiblingIndex = Math.min(totalPages - 1, currentPage + effectiveSiblingCount);
    
    // Add ellipsis indicators and page numbers
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    if (shouldShowLeftDots) {
      pagination.push('ellipsis');
    }
    
    // Add page numbers between ellipses
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pagination.push(i);
      }
    }
    
    if (shouldShowRightDots) {
      pagination.push('ellipsis');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pagination.push(totalPages);
    }
    
    return pagination;
  };
  
  const pagination = generatePagination();
  
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center space-x-1 md:space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Button>
      
      {pagination.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <div key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-8 md:h-9 md:w-9">
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </div>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Button>
    </div>
  );
} 