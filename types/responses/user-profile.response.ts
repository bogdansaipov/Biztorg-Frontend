export interface PublicUserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: "USER" | "SHOP_OWNER" | string;
  createdAt: string;
  totalProducts: number;
  totalFollowers: number;
  averageRating: number | null;
  totalRatings: number;
  isFollowedByCurrentUser: boolean;
}

export interface PublicUserProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: PublicUserProfile;
  errors: unknown | null;
  timestamp: string;
  path: string;
}