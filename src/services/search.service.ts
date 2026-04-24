import { httpClient } from './http-client';
import type { ProductCategory } from '../entities';
import type { ProducerSort, SearchProducerHit, SearchProductHit } from '../entities/search';

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const searchService = {
  searchProducers(o: {
    lat: number;
    lng: number;
    radius?: number;
    category?: ProductCategory;
    q?: string;
    sort?: ProducerSort;
    page?: number;
    pageSize?: number;
  }) {
    const qs = toQuery({
      lat: o.lat,
      lng: o.lng,
      radius: o.radius ?? 50,
      category: o.category,
      q: o.q?.trim() || undefined,
      sort: o.sort ?? 'distance',
      page: o.page ?? 1,
      pageSize: o.pageSize ?? 20,
    });
    return httpClient.getPaginated<SearchProducerHit>(`/search/producers${qs}`);
  },

  searchProducts(q: string, page = 1, pageSize = 20) {
    const qs = toQuery({
      q: q.trim(),
      page,
      pageSize,
    });
    return httpClient.getPaginated<SearchProductHit>(`/search/products${qs}`);
  },
};
