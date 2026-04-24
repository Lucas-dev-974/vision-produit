export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'alternative_proposed'
  | 'confirmed'
  | 'honored'
  | 'not_honored'
  | 'cancelled'
  | 'refused';

/** Ligne renvoyée par `GET /orders/mine` */
export interface OrderListRow {
  id: string;
  status: OrderStatus;
  retrievalDate: string;
  retrievalTimeSlot: string | null;
  createdAt: string;
  counterpartyCompanyName: string | null;
  itemsCount: number;
  unread: boolean;
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  unitPriceSnapshot: string;
}

/** Réponse `GET /orders/:id` */
export interface OrderDetail {
  id: string;
  buyerId: string;
  producerId: string;
  status: OrderStatus;
  retrievalDate: string;
  retrievalTimeSlot: string | null;
  note: string | null;
  cancellationReason: string | null;
  refusalReason: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: { id: string; companyName: string | null };
  producer: { id: string; companyName: string | null };
  items: OrderItemDetail[];
}

export type StockUnit =
  | 'kg'
  | 'g'
  | 'bunch'
  | 'crate'
  | 'unit'
  | 'piece'
  | 'liter';

export interface Order {
  id: string;
  buyerId: string;
  producerId: string;
  status: OrderStatus;
  retrievalDate: string;
  retrievalTimeSlot: string | null;
  note: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: StockUnit;
  unitPriceSnapshot: number;
}
