export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}