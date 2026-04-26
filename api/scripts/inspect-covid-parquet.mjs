// One-off probe for the data.gov.my COVID-19 parquets. Prints schema, row counts,
// distinct states, and head/tail samples. Run when MoH publishes anything new
// (which they have not since June 2025) to verify column names before touching
// the worker's PandemicProvider.
//
//   node scripts/inspect-covid-parquet.mjs

import {
  asyncBufferFromUrl,
  parquetMetadataAsync,
  parquetSchema,
  parquetReadObjects,
} from "hyparquet";
import { compressors } from "hyparquet-compressors";

const SOURCES = [
  { name: "cases", url: "https://storage.data.gov.my/healthcare/covid_cases.parquet" },
  { name: "deaths", url: "https://storage.data.gov.my/healthcare/covid_deaths_linelist.parquet" },
];

for (const { name, url } of SOURCES) {
  console.log(`\n=== ${name} (${url}) ===`);
  const file = await asyncBufferFromUrl({ url });
  const metadata = await parquetMetadataAsync(file);
  const schema = parquetSchema(metadata);
  const cols = schema.children.map((c) => `${c.element.name}: ${c.element.type ?? "group"}`);
  console.log(`columns (${schema.children.length}):`);
  for (const c of cols) console.log(`  - ${c}`);
  console.log(`row count: ${metadata.num_rows}`);

  const rows = await parquetReadObjects({ file, compressors, rowStart: 0, rowEnd: 3 });
  console.log("first 3 rows:");
  for (const r of rows)
    console.log(`  ${JSON.stringify(r, (_, v) => (typeof v === "bigint" ? Number(v) : v))}`);

  const last = await parquetReadObjects({
    file,
    compressors,
    rowStart: Number(metadata.num_rows) - 3,
    rowEnd: Number(metadata.num_rows),
  });
  console.log("last 3 rows:");
  for (const r of last)
    console.log(`  ${JSON.stringify(r, (_, v) => (typeof v === "bigint" ? Number(v) : v))}`);

  const states = new Set();
  const all = await parquetReadObjects({ file, compressors, columns: ["state", "date"] });
  for (const r of all) states.add(r.state);
  console.log(`distinct states (${states.size}): ${[...states].sort().join(" | ")}`);
  console.log(`date range: ${all[0]?.date} → ${all[all.length - 1]?.date}`);
}
