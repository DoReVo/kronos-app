import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(SCRIPT_DIR, "../test-fixtures/jakim");
const YEAR = 2026;

const ZONES = {
  WLY01: { latitude: 3.1485690551600367, longitude: 101.69349293389735, place: "Kuala Lumpur" },
  PNG01: { latitude: 5.413682897386017, longitude: 100.32813515325944, place: "George Town" },
  JHR02: { latitude: 1.478931430206477, longitude: 103.76160461995103, place: "Johor Bahru" },
  SBH07: { latitude: 5.98381496514454, longitude: 116.07756717771564, place: "Kota Kinabalu" },
  SWK08: { latitude: 1.5497205055389873, longitude: 110.35680133517295, place: "Kuching" },
};

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const TARGET_DATES = new Set(MONTH_ABBR.map((m) => `15-${m}-${YEAR}`));

async function fetchYearly(zone) {
  const url = new URL("https://www.e-solat.gov.my/index.php");
  url.search = new URLSearchParams({
    r: "esolatApi/takwimsolat",
    period: "year",
    zone,
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${zone} failed: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (!Array.isArray(json.prayerTime)) {
    throw new Error(`Bad shape for ${zone}: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.prayerTime;
}

await mkdir(FIXTURE_DIR, { recursive: true });

for (const [zone, meta] of Object.entries(ZONES)) {
  process.stdout.write(`Fetching ${zone} (${meta.place})... `);
  const yearly = await fetchYearly(zone);
  const days = yearly.filter((d) => TARGET_DATES.has(d.date));

  if (days.length !== 12) {
    console.warn(`expected 12 days, got ${days.length}`);
    console.warn(
      `  sample dates received: ${yearly
        .slice(0, 3)
        .map((d) => d.date)
        .join(", ")}`,
    );
  } else {
    console.log(`ok (${days.length} days)`);
  }

  const fixture = {
    zone,
    year: YEAR,
    place: meta.place,
    coordinate: { latitude: meta.latitude, longitude: meta.longitude },
    days,
  };

  const out = resolve(FIXTURE_DIR, `${zone}-${YEAR}.json`);
  await writeFile(out, JSON.stringify(fixture, null, 2) + "\n");
}

console.log(`\nWrote fixtures to ${FIXTURE_DIR}`);
