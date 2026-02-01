// Pagination (used across all API modules)
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// User references (used in created_by/updated_by)
export interface UserReference {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

// Audit fields (used in all entities)
export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}

// Optimistic update flag
export interface OptimisticUpdate {
  isOptimistic?: boolean;
}

// API Error response
export interface ApiError {
  error: string;
  message?: string;
}
