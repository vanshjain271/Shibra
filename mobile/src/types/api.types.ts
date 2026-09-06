/**
 * Core API Types - Matching Backend Models
 * Fixed: Address missing isDefault, CartItem wrong product shape,
 *        PaginatedResponse broken generics, Order missing fields,
 *        OrderDetail alias fields
 */

// ==================== USER TYPES ====================
export interface Address {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean; // FIX: was missing, used everywhere
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string; // FIX: used in CheckoutScreen prefill but missing
  role: 'BUYER' | 'ADMIN';
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== PRODUCT TYPES ====================
export interface ProductVariant {
  _id: string;
  sku: string;
  name: string;
  value?: string; // FIX: used in CartItem.tsx as variant.value
  color?: string;
  attributes: Record<string, string>;
  images: string[];
  salePrice: number;
  mrp: number;
  costPrice: number;
  stock: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  images: string[];
  category: {
    _id: string;
    name: string;
    slug: string;
  }[];
  brand?: {
    _id: string;
    name: string;
    slug: string;
    image: string;
  };
  sku: string;
  salePrice: number;
  mrp: number;
  costPrice: number;
  stock: number;
  hsnCode: string;
  taxRate: number;
  variants: ProductVariant[];
  hasVariants: boolean;
  minOrderQty: number;
  maxOrderQty: number;
  unit: string;
  warranty?: string;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
  homepageSections: string[];
  youtubeUrl?: string;
  bulkPricing: {
    minQty: number;
    salePrice: number;
  }[];
  discountPercentage: number;
  totalStock: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== CART TYPES ====================
export interface CartItemProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  sku?: string;
  isActive: boolean;
  minOrderQty: number;
  taxRate: number;
  mrp?: number;
  salePrice?: number;
}

export interface CartItemVariant {
  _id: string;
  name: string;
  value: string;  // FIX: CartItem.tsx uses variant.value
  color?: string;
  sku: string;
  attributes: Record<string, string>;
  images: string[];
}

export interface CartItem {
  _id: string;
  product: CartItemProduct;
  variant?: CartItemVariant | null;
  quantity: number;
  price: number;   // FIX: was missing, used in CartItem.tsx
  mrp: number;
  stock: number;
  available: boolean;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;  // FIX: used in CartScreen & CheckoutScreen
  discount: number;  // FIX: used in CartScreen & CheckoutScreen
  tax: number;       // FIX: used in CartScreen & CheckoutScreen
  shippingCharge: number; // NEW: used in CheckoutScreen
  total: number;
  lastModified: string;
  isAbandoned: boolean;
}

// ==================== ORDER TYPES ====================
export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'FAILED';  // FIX: used in OrderCard getStatusColor

export type PaymentMode = 'PREPAID' | 'COD' | 'UPI_QR' | 'COD_PARTIAL' | 'FULL_PAYMENT';

export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[]; // FIX: OrderDetailsScreen uses item.product.images[0]
  };
  variant?: {
    _id: string;
    name: string;
    value: string;
    color?: string;
  } | null;
  name: string;
  variantName: string;
  sku: string;
  image: string;
  quantity: number;
  price: number;
  mrp: number;
  total: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PaymentDetails {
  mode: PaymentMode;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaid: number;
  codAmount: number;
  status?: string;
  paidAt?: string | null;
  codCollected: boolean;
  codCollectedAt?: string | null;
}

export interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  changedBy?: string | null;
  note: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  tokenReceived: number;
  coupon?: {
    code?: string;
    discountAmount?: number;
  } | null;
  payment: PaymentDetails;
  invoiceUrl?: string;
  deliveryDate?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  stockReserved: boolean;
  stockReservedAt?: string | null;
  stockReservationExpiry?: string | null;
  statusHistory: StatusHistory[];
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason: string;
  invoice?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== INVOICE TYPES ====================
export interface InvoiceItem {
  _id: string;
  product: string;
  variant?: string | null;
  name: string;
  variantName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  price: number;
  mrp: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalWithTax: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  order: string;
  user: string;
  invoiceDate: string;
  billingAddress: ShippingAddress;
  shippingAddress: ShippingAddress;
  items: InvoiceItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  isIntraState: boolean;
  pdfUrl: string;
  url?: string; // FIX: OrderDetailsScreen uses resultAction.payload.url
  status: 'GENERATED' | 'SENT' | 'PAID';
  createdAt: string;
  updatedAt: string;
}

// ==================== BANNER TYPES ====================
export interface Banner {
  _id: string;
  title: string;
  description: string;
  image: string;
  linkType: 'PRODUCT' | 'CATEGORY' | 'URL' | 'NONE';
  linkTarget: string;
  placement: 'HOME_TOP' | 'HOME_MIDDLE' | 'HOME_BOTTOM' | 'PRODUCT_PAGE' | 'CART_PAGE';
  sortOrder: number;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  viewCount: number;
  clickCount: number;
}

// ==================== COUPON TYPES ====================
export interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  applicableProducts: string[];
  applicableCategories: string[];
  allowedUsers: string[];
  isActive: boolean;
}

// ==================== REVIEW TYPES ====================
export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// ==================== NOTIFICATION TYPES ====================
export type NotificationType =
  | 'ORDER_STATUS_UPDATE'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'LOW_STOCK'
  | 'ABANDONED_CART'
  | 'CUSTOM';

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  order?: string | null;
  product?: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
  sentAt?: string | null;
  deliveredAt?: string | null;
  failureReason: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  // FIX: top-level fields returned by backend without data wrapper
  cart?: Cart;
  order?: Order;
  orders?: Order[];
  invoice?: Invoice;
  amountToPay?: number;
  pagination?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  isNewUser?: boolean;
  devOtp?: string;
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
}

export interface OrderCreateResponse {
  success: boolean;
  order: Order;
  amountToPay: number;
}

export interface PaymentInitiateResponse {
  success: boolean;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  order: Order;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  order: Order;
  invoice?: Invoice | null;
}

// ==================== RAZORPAY TYPES ====================
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ==================== CATEGORY & BRAND TYPES ====================
export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  parent?: string | null;
  level: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

// ==================== FIXED PAGINATED RESPONSE ====================
// FIX: Previous conditional generic was broken and unusable
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  products?: Product[];   // for product endpoints
  orders?: Order[];       // for order endpoints
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasMore?: boolean; // FIX: OrdersScreen uses pagination.hasMore
    hasPrev: boolean;
  };
}

// Aliases
export type OrderDetail = Order;
export type PaginatedProductResponse = ProductListResponse;
export type PaginatedOrderResponse = OrderListResponse;