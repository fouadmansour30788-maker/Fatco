"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./LebanonMap";

const LebanonMap = dynamic(() => import("./LebanonMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
      Loading map…
    </div>
  ),
});

export default function LebanonMapClient({ points }: { points: MapPoint[] }) {
  return <LebanonMap points={points} />;
}
