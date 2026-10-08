// "★★★★☆" for a 0–5 rating, rounded to the nearest whole star.
export function starString(rating: number) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function reviewsLabel(count: number) {
  return `${count} review${count === 1 ? "" : "s"}`;
}
