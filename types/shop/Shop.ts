export interface Shop {
  id: string;
  shopOwner: string;
  shopName: string;
  averageRating: number | null;
  totalRatings: number;
  totalNumProducts: number;
  createdAt: string;
  bannerUrl: string | null;
}