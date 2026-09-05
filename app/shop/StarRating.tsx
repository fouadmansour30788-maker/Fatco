// CSS-only star rating input (see .star-rating in globals.css) — reversed DOM
// order (5,4,3,2,1) so the general sibling selector fills every star to the
// visual left of the checked/hovered one. No client JS needed.
export function StarRatingInput({
  name = "rating",
  defaultValue,
}: {
  name?: string;
  defaultValue?: number;
}) {
  return (
    <div className="star-rating" dir="ltr">
      {[5, 4, 3, 2, 1].map((n) => (
        <div key={n} className="contents">
          <input
            type="radio"
            id={`${name}-${n}`}
            name={name}
            value={n}
            defaultChecked={defaultValue === n}
            required
          />
          <label htmlFor={`${name}-${n}`}>★</label>
        </div>
      ))}
    </div>
  );
}

// Read-only display of an average/given rating (fractional averages round to
// the nearest whole star for the glyph fill — the numeric value is shown
// alongside for precision).
export function StarDisplay({ value, size = "text-base" }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={`${size} tracking-tight`} dir="ltr" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "text-amber-500" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </span>
  );
}
