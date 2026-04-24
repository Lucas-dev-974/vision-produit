export function formatIsoDate(iso: string, locale = 'fr-FR'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(d);
}
