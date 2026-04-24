import { formatIsoDate } from './formatters/date';
import type { OrderStatus } from '../entities';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  alternative_proposed: 'Alternative proposée',
  confirmed: 'Confirmée',
  honored: 'Honorée',
  not_honored: 'Non honorée',
  cancelled: 'Annulée',
  refused: 'Refusée',
};

export function orderStatusBadgeClass(status: OrderStatus): string {
  const base = 'rounded-full px-2.5 py-0.5 text-xs font-semibold';
  switch (status) {
    case 'pending':
      return `${base} bg-ochre/15 text-rust`;
    case 'accepted':
    case 'confirmed':
      return `${base} bg-moss/15 text-moss`;
    case 'honored':
      return `${base} bg-moss/25 text-moss`;
    case 'refused':
    case 'cancelled':
    case 'not_honored':
      return `${base} bg-cream-dark text-ink/80`;
    default:
      return `${base} bg-cream-dark text-ink/70`;
  }
}

export function formatOrderRetrievalDate(isoDate: string): string {
  return formatIsoDate(`${isoDate}T12:00:00`);
}
