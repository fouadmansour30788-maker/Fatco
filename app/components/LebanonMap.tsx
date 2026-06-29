"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  name: string;
  ar: string;
  governorate: string;
  lat: number;
  lng: number;
  count: number;
};

export default function LebanonMap({ points }: { points: MapPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));

  return (
    <MapContainer
      center={[34.0, 35.9]}
      zoom={8}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => {
        const radius = 7 + (Math.sqrt(p.count) / Math.sqrt(max)) * 26;
        return (
          <CircleMarker
            key={`${p.governorate}-${p.name}`}
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{
              color: "#c1121f",
              fillColor: "#c1121f",
              fillOpacity: 0.45,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -2]}>
              <div className="text-xs">
                <div className="font-semibold">
                  {p.name} ({p.ar})
                </div>
                <div>{p.count} customer(s)</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
