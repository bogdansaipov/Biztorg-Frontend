import { Product } from "@/types/Product";

export interface FavoritesMeResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product[];
  errors: unknown | null;
  timestamp: string;
  path: string;
}