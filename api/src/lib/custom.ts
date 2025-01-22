// @ts-nocheck
// JAKIM prayer time parameters
const PRAYER_PARAMS = {
  fajr: 20, // Fajr angle
  isha: 18, // Isha angle
  imsak: 20, // Imsak angle
  dhuha: 4.5, // Dhuha angle
  asrFactor: 1, // Asr shadow factor (1 for Shafi'i)
  imsakOffset: -10, // Imsak is 10 minutes before Fajr
};

// JAKIM adjustments in minutes
const JAKIM_ADJUSTMENTS = {
  imsak: 12,
  fajr: 12,
  sunrise: 0,
  dhuhr: 3,
  asr: 2,
  sunset: 2,
  maghrib: 2,
  isha: 2,
};

// Convert degrees to radians
export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Convert radians to degrees
export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

// Convert Gregorian date to Julian date
export function gregorianToJulian(date) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5;

  return jd;
}

// Calculate sun declination
function getSunDeclination(jd) {
  const d = jd - 2451545.0;
  const g = 357.529 + 0.98560028 * d;
  const q = 280.459 + 0.98564736 * d;
  const l =
    q + 1.915 * Math.sin(toRadians(g)) + 0.02 * Math.sin(toRadians(2 * g));

  const e = 23.439 - 0.00000036 * d;
  const delta = Math.asin(Math.sin(toRadians(e)) * Math.sin(toRadians(l)));

  return toDegrees(delta);
}

// Calculate equation of time
function getEquationOfTime(jd) {
  const d = jd - 2451545.0;
  const g = 357.529 + 0.98560028 * d;
  const q = 280.459 + 0.98564736 * d;
  const l =
    q + 1.915 * Math.sin(toRadians(g)) + 0.02 * Math.sin(toRadians(2 * g));

  const e = 23.439 - 0.00000036 * d;
  const ra = toDegrees(
    Math.atan2(
      Math.cos(toRadians(e)) * Math.sin(toRadians(l)),
      Math.cos(toRadians(l)),
    ),
  );

  return (q - ra) / 15;
}

// Calculate time based on angle
function getTimeByAngle(params) {
  const {
    angle,
    latitude,
    longitude,
    sunDeclination,
    dhuhr,
    isNight = false,
  } = params;

  const term1 = -Math.sin(toRadians(angle));
  const term2 =
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(sunDeclination));
  const term3 =
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(sunDeclination));

  const cosValue = (term1 - term2) / term3;

  if (Math.abs(cosValue) > 1) {
    return null;
  }

  const T = toDegrees(Math.acos(cosValue)) / 15;
  return dhuhr + (isNight ? T : -T);
}

// Calculate Asr time
function calculateAsr(params) {
  const { latitude, sunDeclination, dhuhr } = params;

  // Convert to radians once
  const decl = toRadians(sunDeclination);
  const lat = toRadians(latitude);

  // Calculate mid-day altitude for more precision
  const altitude = Math.PI / 2 - Math.abs(lat - decl);

  // Get Asr shadow ratio (Shafi'i method)
  const asrFactor = Math.PI / 4; // arctan(1)
  const shadowRatio = 1 + Math.tan(Math.abs(lat - decl));

  // Calculate Asr angle with higher precision
  const asrAngle = Math.atan(1 / shadowRatio);

  // Calculate hour angle with full precision
  const numerator = Math.sin(asrAngle) - Math.sin(lat) * Math.sin(decl);
  const denominator = Math.cos(lat) * Math.cos(decl);
  const H = Math.acos(numerator / denominator);

  // Convert to hours with minimal rounding
  const T = toDegrees(H) / 15;

  // Apply final adjustment for JAKIM standard
  return dhuhr + T;
}

// Calculate Fajr time
function calculateFajr(params) {
  return getTimeByAngle({
    ...params,
    angle: PRAYER_PARAMS.fajr,
    isNight: false,
  });
}

// Format time to HH:mm
function formatTime(time) {
  if (!time) return null;

  time = time % 24;
  if (time < 0) time += 24;

  const hours = Math.floor(time);
  const minutes = Math.floor((time - hours) * 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// Main calculation function
export function calculatePrayerTimes(
  date,
  latitude,
  longitude,
  timezone,
  useJakimAdjustments = false,
) {
  const jd = gregorianToJulian(date);
  const sunDeclination = getSunDeclination(jd);
  const eqt = getEquationOfTime(jd);

  // Calculate Dhuhr time
  const dhuhr = 12 + timezone - longitude / 15 - eqt;

  // Common parameters for angle calculations
  const commonParams = {
    latitude,
    longitude,
    sunDeclination,
    dhuhr,
  };

  // Calculate raw times
  let times = {
    fajr: calculateFajr(commonParams),
    imsak: null, // Will be set after Fajr
    sunrise: getTimeByAngle({ ...commonParams, angle: 0.833, isNight: false }),
    dhuhr: dhuhr,
    asr: calculateAsr(commonParams),
    sunset: getTimeByAngle({ ...commonParams, angle: 0.833, isNight: true }),
    maghrib: getTimeByAngle({ ...commonParams, angle: 0.833, isNight: true }),
    isha: getTimeByAngle({
      ...commonParams,
      angle: PRAYER_PARAMS.isha,
      isNight: true,
    }),
  };

  // Set Imsak 10 minutes before Fajr
  if (times.fajr) {
    times.imsak = times.fajr + PRAYER_PARAMS.imsakOffset / 60;
  }

  // Apply JAKIM adjustments if requested
  if (useJakimAdjustments) {
    for (let prayer in times) {
      if (times[prayer] && JAKIM_ADJUSTMENTS[prayer]) {
        times[prayer] += JAKIM_ADJUSTMENTS[prayer] / 60;
      }
    }
  }

  // Convert to formatted time strings
  return Object.fromEntries(
    Object.entries(times).map(([prayer, time]) => [prayer, formatTime(time)]),
  );
}
