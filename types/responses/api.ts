export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors: unknown | null;
  timestamp: string;
  path: string;
}