/**
 * Builds a standardized pagination metadata object.
 * Returns both `totalItems` (as specified in docs/06-api-design) and `total` (for backwards compatibility).
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalItems: number;
  totalPages: number;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const safeLimit = Math.max(1, limit);
  return {
    page,
    limit: safeLimit,
    total,
    totalItems: total,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}
