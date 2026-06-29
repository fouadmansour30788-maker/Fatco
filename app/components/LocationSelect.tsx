"use client";

import { useMemo, useState } from "react";
import { LEBANON, districtsOf, townsOf } from "@/lib/lebanon";

const OTHER = "__other__";

export default function LocationSelect({
  defaultGovernorate = "",
  defaultDistrict = "",
  defaultSubDistrict = "",
}: {
  defaultGovernorate?: string;
  defaultDistrict?: string;
  defaultSubDistrict?: string;
}) {
  const [gov, setGov] = useState(defaultGovernorate);
  const [district, setDistrict] = useState(defaultDistrict);

  const towns = useMemo(() => townsOf(gov, district), [gov, district]);
  const knownTown =
    defaultSubDistrict && towns.includes(defaultSubDistrict)
      ? defaultSubDistrict
      : defaultSubDistrict
      ? OTHER
      : "";
  const [subSel, setSubSel] = useState(knownTown);
  const [subOther, setSubOther] = useState(
    knownTown === OTHER ? defaultSubDistrict : ""
  );

  const districts = districtsOf(gov);
  const subValue = subSel === OTHER ? subOther : subSel;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <input type="hidden" name="subDistrict" value={subValue} />

      <div>
        <label className="label">Governorate</label>
        <select
          name="governorate"
          className="input"
          value={gov}
          onChange={(e) => {
            setGov(e.target.value);
            setDistrict("");
            setSubSel("");
            setSubOther("");
          }}
        >
          <option value="">Select…</option>
          {LEBANON.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name} ({g.ar})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">District</label>
        <select
          name="district"
          className="input"
          value={district}
          disabled={!gov}
          onChange={(e) => {
            setDistrict(e.target.value);
            setSubSel("");
            setSubOther("");
          }}
        >
          <option value="">Select…</option>
          {districts.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name} ({d.ar})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Town / area</label>
        <select
          className="input"
          value={subSel}
          disabled={!district}
          onChange={(e) => setSubSel(e.target.value)}
        >
          <option value="">Select…</option>
          {towns.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value={OTHER}>Other…</option>
        </select>
        {subSel === OTHER && (
          <input
            className="input mt-2"
            placeholder="Type town / area"
            value={subOther}
            onChange={(e) => setSubOther(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
