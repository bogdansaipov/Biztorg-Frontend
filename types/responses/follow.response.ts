import { Product } from "@/types/Product";

export interface FollowedUserEntry {
  followedAt: string;
  user: {
    id: string;
    name: string;
    phone: string | null;
  };
  // Up to 12 most recent products, per the endpoint description.
  products: Product[];
}

// Shape inferred to mirror FollowedUserEntry — the example response had an
// empty `shops` array, so this hasn't actually been confirmed against a
// real populated example yet. Adjust `shop` fields if they differ once you
// have a real shop-follow response to check against.
export interface FollowedShopEntry {
  followedAt: string;
  shop: {
    id: string;
    shopName: string;
    bannerUrl: string | null;
    averageRating: number | null;
    totalRatings: number;
  };
  products: Product[];
}

export interface FollowsMeData {
  users: FollowedUserEntry[];
  shops: FollowedShopEntry[];
}

export interface FollowsMeResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: FollowsMeData;
  errors: unknown | null;
  timestamp: string;
  path: string;
}