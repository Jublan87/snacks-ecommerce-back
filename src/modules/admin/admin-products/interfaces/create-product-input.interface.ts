export interface CreateProductImageInput {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface CreateVariantOptionInput {
  value: string;
  priceModifier?: number | null;
  stock: number;
  sku?: string | null;
}

export interface CreateProductVariantInput {
  name: string;
  options: CreateVariantOptionInput[];
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string | null;
  sku: string;
  price: number;
  discountPercentage?: number | null;
  stock: number;
  categoryId: string;
  specifications?: unknown;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  weight?: number | null;
  dimensions?: unknown;
  images: CreateProductImageInput[];
  variants?: CreateProductVariantInput[];
}
