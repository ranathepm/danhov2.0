/**
 * Strips metal suffix and category type suffix from a product name for clean display.
 *
 * Examples:
 *   "Danhov Abbraccio Swirl Band in 14k with Black Rhodium"          → "Danhov Abbraccio Swirl Band"
 *   "Danhov Per Lei Asscher Engagement Ring in 14k White Gold"        → "Danhov Per Lei Asscher"
 *   "Danhov Abbraccio Handmade Engagement Ring in Platinum"           → "Danhov Abbraccio Handmade"
 *   "Danhov Classico Classic Wedding Band in 18k Yellow Gold"         → "Danhov Classico Classic"
 */
export function stripMetalSuffix(name: string): string {
  return name
    // 1. Strip metal suffix ("in 14k...", "in Platinum", etc.)
    .replace(
      /\s+in\s+(14k|18k|platinum|white\s+gold|yellow\s+gold|rose\s+gold|silver|palladium).*$/i,
      ''
    )
    // 2. Strip trailing category type words
    .replace(
      /\s+(engagement\s+ring|wedding\s+band|anniversary\s+ring|fashion\s+ring|promise\s+ring|eternity\s+band|eternity\s+ring|stackable\s+ring|right\s+hand\s+ring|mens?\s+ring|men['']s\s+band)s?$/i,
      ''
    )
    .trim();
}
