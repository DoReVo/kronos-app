import { useGeolocation } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { latlongAtom } from "../atoms";
import { Loading } from "./base/loading";

const fmt = (n: number): string => n.toFixed(4);

export function UserCoordinate() {
  const { loading, latitude, longitude, error } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: Infinity,
  });

  let errorMessage: string | null = null;

  if (error?.code === GeolocationPositionError.PERMISSION_DENIED) {
    errorMessage = "Location access denied.";
  } else if (error?.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
    errorMessage = "Location unavailable.";
  } else if (error?.code === GeolocationPositionError.TIMEOUT) {
    errorMessage = "Location request timed out.";
  } else if (error?.message !== undefined && error.message !== "") {
    errorMessage = error.message;
  }

  const hasLocation = latitude !== null && longitude !== null;

  const setLatLong = useSetAtom(latlongAtom);

  useEffect(() => {
    void setLatLong([latitude, longitude]);
  }, [latitude, longitude, setLatLong]);

  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="kicker">your coordinate</div>

      {loading && <Loading>fixing position</Loading>}

      {hasLocation && (
        <div className="flex items-baseline gap-3 font-mono text-sm tabular text-ink-quiet">
          <span>{fmt(latitude)}°</span>
          <span className="text-ink-faint">·</span>
          <span>{fmt(longitude)}°</span>
        </div>
      )}

      {errorMessage !== null && (
        <div className="font-display italic text-sm text-accent">{errorMessage}</div>
      )}
    </div>
  );
}
