import { Heart } from "lucide-react";
import { toggleWishlist } from "./actions";

export default function WishlistButton({
  itemId,
  active,
  redirectTo,
  label,
}: {
  itemId: string;
  active: boolean;
  redirectTo: string;
  label: string;
}) {
  return (
    <form action={toggleWishlist}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white ${
          active ? "text-brand" : "text-zinc-400"
        }`}
      >
        <Heart size={16} className={active ? "fill-brand" : ""} />
      </button>
    </form>
  );
}
