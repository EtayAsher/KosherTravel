"use client";

import { Button } from "@/components/ui/button";

export function ShabbatControls({
  enabled,
  setEnabled,
  radius,
  setRadius,
  setOriginMode,
  useCenter
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  radius: number;
  setRadius: (n: number) => void;
  setOriginMode: () => void;
  useCenter: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Shabbat Mode
      </label>
      {enabled && (
        <>
          <Button onClick={setOriginMode}>Set Shabbat Origin</Button>
          <Button onClick={useCenter}>Use map center</Button>
          <div className="flex items-center gap-2 text-sm">
            <span>Radius {radius.toFixed(1)}km</span>
            <input type="range" min={0.5} max={2} step={0.1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
          </div>
        </>
      )}
    </div>
  );
}
