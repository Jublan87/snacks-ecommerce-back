export interface AdminOrderUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AdminOrderItemProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
}

export interface AdminOrderItem {
  id: string;
  product: AdminOrderItemProduct;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  user: AdminOrderUser;
  items: AdminOrderItem[];
  shippingAddress: Record<string, unknown>;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminOrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
}

export interface PaginatedAdminOrders {
  items: AdminOrderDetail[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: AdminOrderSummary;
}
