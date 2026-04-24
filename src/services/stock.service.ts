import { httpClient } from './http-client';
import type { CreateStockDto, Stock, UpdateStockDto } from '../entities';

export const stockService = {
  listMine: () => httpClient.get<Stock[]>('/stocks/mine'),
  create: (data: CreateStockDto) => httpClient.post<Stock>('/stocks', data),
  update: (id: string, data: UpdateStockDto) =>
    httpClient.patch<Stock>(`/stocks/${id}`, data),
  delete: (id: string) => httpClient.delete<void>(`/stocks/${id}`),
};
