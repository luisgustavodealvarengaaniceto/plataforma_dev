'use client';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages } = pagination;

  return (
    <div className="flex justify-between items-center">
      <Button onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        Anterior
      </Button>
      <span>Página {page} de {totalPages}</span>
      <Button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        Próximo
      </Button>
    </div>
  );
}