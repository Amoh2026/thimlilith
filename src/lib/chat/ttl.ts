export function computeExpiresAt(): any {
  // 24 hours from now
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}