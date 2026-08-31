import Link from "next/link";
import { Package } from "lucide-react";
import { formatMoney } from "@/lib/format";

export default function ProductCard({
  id,
  name,
  category,
  imageUrl,
  salePrice,
  outOfStock,
  outOfStockLabel,
}: {
  id: string;
  name: string;
  category?: string | null;
  imageUrl?: string | null;
  salePrice: number;
  outOfStock: boolean;
  outOfStockLabel: string;
}) {
  return (
    <Link
      href={`/shop/${id}`}
      className="card overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-zinc-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-zinc-300" size={40} />
        )}
      </div>
      <div className="p-3">
        {category && <div className="text-xs text-zinc-400">{category}</div>}
        <div className="line-clamp-2 text-sm font-medium">{name}</div>
        <div className="mt-1 font-semibold">{formatMoney(salePrice)}</div>
        {outOfStock && <div className="mt-1 text-xs text-red-500">{outOfStockLabel}</div>}
      </div>
    </Link>
  );
}
