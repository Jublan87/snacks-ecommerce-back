export interface OrderShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface OrderProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface OrderProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface OrderProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: OrderProductImage[];
  categoryId: string;
  category: OrderProductCategory;
}

export interface OrderItemDetail {
  id: string;
  product: OrderProduct;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItemDetail[];
  shippingAddress: OrderShippingAddress;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedOrders {
  orders: OrderDetail[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PricedItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  previousStock: number;
}
