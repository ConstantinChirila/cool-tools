/**
 * A fair roll of an n-sided die, 1..n. Draws from the platform's
 * cryptographic generator and rejects the uneven tail of the 32-bit range, so
 * every face is exactly equally likely (a bare `% sides` slightly favours the
 * low faces whenever sides does not divide 2^32).
 */
export function rollDie(sides: number): number {
  const n = Math.max(1, Math.floor(sides));
  const range = 0x1_0000_0000;
  const limit = range - (range % n);
  const draw = new Uint32Array(1);
  do {
    crypto.getRandomValues(draw);
  } while (draw[0]! >= limit);
  return (draw[0]! % n) + 1;
}
