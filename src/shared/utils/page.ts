// =============================================================
// Paginação
// =============================================================
export interface PaginationParams {
    page:  number
    limit: number
    skip:  number
    take:  number
  }
  
  export interface PaginatedResult<T> {
    data: T[]
    meta: {
      total:      number
      page:       number
      limit:      number
      totalPages: number
    }
  }
  
  export function parsePagination(query: Record<string, unknown>): PaginationParams {
    const page  = Math.max(1, parseInt(String(query.page  ?? 1)))
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20))))
    return { page, limit, skip: (page - 1) * limit, take: limit }
  }
  
  export function paginar<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T> {
    return {
      data,
      meta: {
        total,
        page:       params.page,
        limit:      params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    }
  }
  