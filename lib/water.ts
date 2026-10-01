/**
 * Mains water prices shared by the garden tools that water things (lawn,
 * water butt, drip irrigation).
 *
 * On a meter, households in England and Wales pay for water and for
 * sewerage on most of what comes through the meter, garden water included,
 * so the price of a litre saved or used is the two together. Thames Water
 * charges £4.21/m³ and United Utilities £5.51/m³ for both in 2026/27.
 */
export const WATER_PRICE = 4.5;

/** The price field's hint, so every tool quotes the same figures. */
export const WATER_PRICE_HINT = "On a meter, water and sewerage together: about £4.20 (Thames) to £5.50 (United Utilities) in 2026/27.";
