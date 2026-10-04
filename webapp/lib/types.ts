export type ProductDTO = {
  id: string;
  name: string;
  material: string | null;
  description: string | null;
  priceUsd: number;
  originalPriceUsd: number | null;
  category: string | null;
  beadSize: string | null;
  stock: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  images: string[];
  badge: string | null;
  rating: number;
  reviewCount: number;
  active: boolean;
  featured: boolean;
};

export type CartLine = {
  id: string;
  qty: number;
};

export type ResolvedCartLine = {
  id: string;
  name: string;
  priceUsd: number;
  qty: number;
  imageUrl: string | null;
};

export type ShippingAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderDTO = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: Partial<ShippingAddress>;
  items: ResolvedCartLine[];
  subtotalUsd: number;
  discountUsd: number;
  couponCode: string | null;
  shippingUsd: number;
  totalUsd: number;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  date: string;
};

export type BookingDTO = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  clientEmail: string;
  birthName: string;
  dateOfBirth: string;
  packageSelected: string | null;
  packagePriceUsd: number | null;
  timezone: string | null;
  sessionDate: string | null;
  readingFocus: string | null;
  additionalNotes: string | null;
  status: string;
  submittedAt: string;
};
