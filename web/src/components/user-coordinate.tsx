import { useGeolocation } from "@uidotdev/usehooks";

import cs from "clsx";
import { Spinner } from "./base/spinner";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { latlongAtom } from "../atoms";

const RootStyle = cs(["text-white", "flex flex-col gap-2"]);

const CoordinateStyle = cs([
  "p-2 rounded bg-coordinate-background flex-1 max-w-200px text-center",
]);
const CoordinateContainerStyle = cs(["flex gap-2 items-center justify-center"]);

export function UserCoordinate() {
  const { loading, latitude, longitude, error } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: Infinity,
  });

  let errorMessage = null;

  if (error?.code === GeolocationPositionError.PERMISSION_DENIED) {
    errorMessage = "You have denied the request to share your location.";
  } else if (error?.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
    errorMessage = "Your location is unavailable.";
  } else if (error?.code === GeolocationPositionError.TIMEOUT) {
    errorMessage = "The request to get your location timed out.";
  } else if (error?.message) {
    errorMessage = error?.message;
  }

  const hasLocation = latitude !== null && longitude !== null;

  const setLatLong = useSetAtom(latlongAtom);

  useEffect(() => {
    setLatLong([latitude, longitude]);
  }, [latitude, longitude]);

  return (
    <div className={RootStyle}>
      <div className="text-md text-center">Your Location</div>

      {loading && (
        <div className="flex items-center justify-center">
          <Spinner className="text-3xl" />
        </div>
      )}

      {hasLocation && (
        <>
          <div className={CoordinateContainerStyle}>
            <div className={CoordinateStyle}>{latitude}</div>
            <div className={CoordinateStyle}>{longitude}</div>
          </div>
        </>
      )}

      {errorMessage && (
        <div className="flex items-center justify-center text-red-400">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
