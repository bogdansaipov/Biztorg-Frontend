export interface RatingImage {
  id: string;
  imageUrl: string;
  position: number;
}

export interface RatingRater {
  id: string;
  name: string;
}

export interface RatedProduct {
  id: string;
  name: string;
  mainImageUrl: string | null;
}

export interface ProductRating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  rater: RatingRater;
  product: RatedProduct;
  images: RatingImage[];
}

export interface ReceivedRatingsData {
  averageRating: number;
  totalRatings: number;
  ratings: ProductRating[];
}

export interface ReceivedRatingsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReceivedRatingsData;
  errors: unknown | null;
  timestamp: string;
  path: string;
}