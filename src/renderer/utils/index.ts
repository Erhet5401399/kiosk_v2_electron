export function formatServicePrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Үнэгүй';
  }

  const numericValue = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d.-]/g, '').trim());

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 'Үнэгүй';
  }

  return `${numericValue.toLocaleString('mn-MN')}₮`;
}
