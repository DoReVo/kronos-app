import type { Key } from "react-aria";
import { ComboBox } from "./base/combo-box";
import { ZONE_OPTIONS, ZoneSchema } from "@kronos/common";
import { zoneAtom } from "../atoms";
import { useSetAtom } from "jotai";

export function ZoneSelector() {
  const zones = Object.entries(ZONE_OPTIONS).map(([key, value]) => {
    const items = Object.entries(value).map(([key, value]) => ({
      zone: key,
      value,
    }));
    return {
      title: key,
      items,
    };
  });

  const setZoneAtom = useSetAtom(zoneAtom);

  const onChangeHandler = (key: Key | null) => {
    const validZone = ZoneSchema.parse(key);

    setZoneAtom(validZone);
  };

  return (
    <ComboBox onSelectionChange={onChangeHandler}>
      {zones.map((entry) => (
        <ComboBox.Section
          key={entry.title}
          title={entry.title}
          items={entry.items}
        >
          {(zone) => {
            return <ComboBox.Item id={zone.zone}>{zone.value}</ComboBox.Item>;
          }}
        </ComboBox.Section>
      ))}
    </ComboBox>
  );
}
