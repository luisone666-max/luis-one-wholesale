export const LOYALTY_PHP_PER_POINT = 100;

export function calculateLoyaltyPoints(amount: number | null | undefined) {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value / LOYALTY_PHP_PER_POINT);
}

export function formatLoyaltyPoints(points: number) {
  return `${points.toLocaleString("en-US")} point${points === 1 ? "" : "s"}`;
}
