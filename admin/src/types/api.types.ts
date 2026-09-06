export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'CONSUMER' | 'RETAILER';
  hasGSTNo: boolean;
  gstNo?: string;
  isAffiliate: boolean;
  blockCOD: boolean;
  billingAddress?: Address;
  shippingAddress?: Address;
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface Address {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  category: Category[];
  brand?: Brand;
  images: string[];
  mrp: number;
  salePrice: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Brand {
  _id: string;
  name: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMode: 'PREPAID' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  shippingAddress: Address;
  createdAt: string;
}

export interface OrderItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
