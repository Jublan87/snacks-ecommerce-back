export interface CartProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  images: CartProductImage[];
}

export interface CartItemDetail {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  addedAt: Date;
  product: CartProduct;
  /** false si el producto está inactivo o el stock es insuficiente para la cantidad */
  isAvailable: boolean;
}

export interface CartWithItems {
  id: string;
  userId: string;
  items: CartItemDetail[];
  updatedAt: Date;
}
