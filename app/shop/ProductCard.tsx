import Link from "next/link";
import { Package, Star } from "lucide-react";
import { formatMoney } from "@/lib/format";

export default function ProductCard({
  id,
  name,
  category,
  imageUrl,
  salePrice,
  outOfStock,
  outOfStockLabel,
  avgRating,
  reviewCount,
  wishlistButton,
}: {
  id: string;
  name: string;
  category?: string | null;
  imageUrl?: string | null;
  salePrice: number;
  outOfStock: boolean;
  outOfStockLabel: string;
  avgRating?: number | null;
  reviewCount?: number;
  wishlistButton?: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={`/shop/${id}`} className="block">
          <div className="flex aspect-square items-center justify-center bg-zinc-100">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <Package className="text-zinc-300" size={40} />
            )}
          </div>
        </Link>
        {wishlistButton && (
          <div className="absolute end-2 top-2">{wishlistButton}</div>
        )}
      </div>
      <Link href={`/shop/${id}`} className="block p-3">
        {category && <div className="text-xs text-zinc-400">{category}</div>}
        <div className="line-clamp-2 text-sm font-medium">{name}</div>
        {reviewCount != null && reviewCount > 0 && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            {avgRating?.toFixed(1)} ({reviewCount})
          </div>
        )}
        <div className="mt-1 font-semibold">{formatMoney(salePrice)}</div>
        {outOfStock && <div className="mt-1 text-xs text-red-500">{outOfStockLabel}</div>}
      </Link>
    </div>
  );
}
