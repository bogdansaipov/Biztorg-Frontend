import { Currency } from "@/enums/CurrencyEnum";
import { ProductImage } from "./images/image";
import { Region } from "./region/region";
import { User } from "./user/user";
import { Category } from "./category";
import { Attribute } from "./attribute/attribute";

export interface Product {
    id: string,
    categoryId: string,
    userId: string,
    name: string,
    slug: string,
    description: string,
    price: string | null,
    currency: Currency,
    latitude: number,
    longitude: number,
    isUrgent: boolean,
    enableTelegram: boolean,
    contactName: string,
    contactPhone: string,
    facebookPostId:  string | null,
    telegramPostId: string | null,
    instagramPostId: string | null,
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    region: Region,
    images: ProductImage[],
    user: User,
    category: Category,
    attributes: Attribute[]
}