/** Star glyph shared by the favourite toggle and the favourites nav link. */
export function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2.9l2.82 5.72 6.31.92-4.57 4.45 1.08 6.29L12 17.28l-5.64 2.97 1.08-6.29-4.57-4.45 6.31-.92z" />
    </svg>
  );
}
