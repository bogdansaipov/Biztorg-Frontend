// Shape returned by GET /shop-profiles/{id}/edit — note this is NOT the
// same as ShopProfile below: no id, no verificationStatus, no aggregate
// stats — just the raw editable fields for pre-filling the edit form.
export interface ShopEditData {
  shopName: string;
  description: string | null;
  businessType: "SELF_EMPLOYED" | "INDIVIDUAL" | "LLC" | null;
  taxIdNumber: string | null;
  contactName: string | null;
  address: string | null;
  phone: string;
  bannerUrl: string | null;
  facebookLink: string | null;
  telegramLink: string | null;
  instagramLink: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ShopEditResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ShopEditData;
  errors: unknown | null;
  timestamp: string;
  path: string;
}

export interface MyShopItem {
  id: string;
  shopName: string;
  bannerUrl: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | string;
}

export interface MyShopsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: MyShopItem[];
  errors: unknown | null;
  timestamp: string;
  path: string;
}

export interface ShopProfile {
  id: string;
  userId: string;
  shopName: string;
  description: string | null;
  businessType: "SELF_EMPLOYED" | "INDIVIDUAL" | "LLC" | null;
  taxIdNumber: string | null;
  contactName: string | null;
  address: string | null;
  phone: string;
  bannerUrl: string | null;
  facebookLink: string | null;
  telegramLink: string | null;
  instagramLink: string | null;
  website: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | string;
  rejectionReason: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ShopProfile;
  errors: unknown | null;
  timestamp: string;
  path: string;
}

export interface PublicShopProfile {
  userId: string;
  shopName: string;
  description: string | null;
  businessType: "SELF_EMPLOYED" | "INDIVIDUAL" | "LLC" | null;
  contactName: string | null;
  address: string | null;
  phone: string;
  bannerUrl: string | null;
  facebookLink: string | null;
  telegramLink: string | null;
  instagramLink: string | null;
  website: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | string;
  latitude: number | null;
  longitude: number | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  totalProducts: number;
  totalFollowers: number;
  totalMembers: number;
  averageRating: number | null;
  totalRatings: number;
  isFollowedByCurrentUser: boolean;
}

export interface PublicShopProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: PublicShopProfile;
  errors: unknown | null;
  timestamp: string;
  path: string;
}