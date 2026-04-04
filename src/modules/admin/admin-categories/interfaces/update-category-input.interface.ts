export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  image?: string | null;
  order?: number;
  isActive?: boolean;
}
