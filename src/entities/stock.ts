import type { StockUnit } from './order';

export interface Stock {
  id: string;
  productId: string;
  quantity: string;
  unit: StockUnit;
  unitPrice: string;
  availableFrom: string;
  expiresAt: string;
}

export interface CreateStockDto {
  productId: string;
  quantity: number;
  unit: StockUnit;
  unitPrice: number;
  availableFrom: string;
  expiresAt: string;
}

export type UpdateStockDto = Partial<{
  quantity: number;
  unit: StockUnit;
  unitPrice: number;
  availableFrom: string;
  expiresAt: string;
}>;
