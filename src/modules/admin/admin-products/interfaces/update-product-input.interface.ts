export interface UpdateProductImageInput {
  id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface UpdateVariantOptionInput {
  id?: string;
  value: string;
  priceModifier?: number | null;
  stock: number;
  sku?: string | null;
}

export interface UpdateProductVariantInput {
  id?: string;
  name: string;
  options: UpdateVariantOptionInput[];
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string | null;
  sku?: string;
  price?: number;
  discountPercentage?: number | null;
  stock?: number;
  categoryId?: string;
  specifications?: unknown;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  weight?: number | null;
  dimensions?: unknown;
  images?: UpdateProductImageInput[];
  variants?: UpdateProductVariantInput[];
}
