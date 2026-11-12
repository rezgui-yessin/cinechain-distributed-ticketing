export type ConcessionCategory = 'COMBOS' | 'POPCORN' | 'BEVERAGES' | 'HOT_BITES' | 'SNACKS';
export type ConcessionOrderStatus = 'PENDING' | 'PREPARING' | 'DELIVERED' | 'CANCELLED';
export type ConcessionDeliveryType = 'IN_SEAT' | 'COUNTER_PICKUP';

export interface ConcessionItem {
  id: number;
  name: string;
  category: ConcessionCategory;
  description: string;
  price: number;
  imageUrl: string;
  badge?: string;
  calories?: number;
  available: boolean;
}

export interface ConcessionOrderItem {
  id: number;
  itemId?: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  options?: string;
}

export interface ConcessionOrder {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  ticketId?: number;
  screeningId?: number;
  hallName?: string;
  seatLabel?: string;
  totalAmount: number;
  status: ConcessionOrderStatus;
  deliveryType: ConcessionDeliveryType;
  notes?: string;
  items: ConcessionOrderItem[];
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
}

export interface CreateConcessionOrderRequest {
  ticketId?: number;
  screeningId?: number;
  hallName?: string;
  seatLabel?: string;
  deliveryType: ConcessionDeliveryType;
  notes?: string;
  items: {
    itemId: number;
    quantity: number;
    options?: string;
  }[];
}
