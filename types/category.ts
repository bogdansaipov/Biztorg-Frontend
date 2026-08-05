export interface Category {
    id: string;
    name: string;
    nameUz: string | null;
    slug: string;
    parentId: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}