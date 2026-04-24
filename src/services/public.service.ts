import { httpClient } from './http-client';
import type { PublicProducer, PublicProducerDetail } from '../entities/public-producer';

export const publicService = {
  listProducers: (page = 1, pageSize = 12) =>
    httpClient.getPaginated<PublicProducer>(
      `/public/producers?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
    ),

  getProducerDetail: (producerUserId: string) =>
    httpClient.get<PublicProducerDetail>(`/public/producers/${producerUserId}`),
};
