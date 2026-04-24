import { httpClient } from './http-client';
import type { OrderDetail, OrderListRow } from '../entities';

export interface CreateOrderPayload {
  producerId: string;
  retrievalDate: string;
  retrievalTimeSlot?: string | null;
  note?: string | null;
  items: { stockId: string; quantity: number }[];
}

export const orderService = {
  listMine: (page = 1, pageSize = 20) =>
    httpClient.getPaginated<OrderListRow>(
      `/orders/mine?page=${page}&pageSize=${pageSize}`,
    ),

  getById: (id: string) => httpClient.get<OrderDetail>(`/orders/${id}`),

  acknowledgeSeen: (id: string) => httpClient.post<void>(`/orders/${id}/seen`, {}),

  create: (body: CreateOrderPayload) =>
    httpClient.post<OrderDetail>('/orders', body),

  accept: (id: string) => httpClient.post<OrderDetail>(`/orders/${id}/accept`, {}),

  refuse: (id: string, reason: string) =>
    httpClient.post<OrderDetail>(`/orders/${id}/refuse`, { reason }),

  cancel: (id: string, reason: string) =>
    httpClient.post<OrderDetail>(`/orders/${id}/cancel`, { reason }),

  markHonored: (id: string) =>
    httpClient.post<OrderDetail>(`/orders/${id}/mark-honored`, {}),

  markNotHonored: (id: string) =>
    httpClient.post<OrderDetail>(`/orders/${id}/mark-not-honored`, {}),
};
