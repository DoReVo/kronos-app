import type { Key } from "react-aria";
import { ComboBox } from "./base/combo-box";
import { ZONE_OPTIONS, ZoneSchema } from "@kronos/common";
import { zoneAtom } from "../atoms";
import { useAtom } from "jotai";

export function ZoneSelector() {
  const zones = Object.entries(ZONE_OPTIONS).map(([groupTitle, group]) => {
    const items = Object.entries(group).map(([zoneKey, zoneName]) => ({
      zone: zoneKey,
      value: zoneName,
    }));
    return {
      title: groupTitle,
      items,
    };
  });

  const [zone, setZoneAtom] = useAtom(zoneAtom);

  const onChangeHandler = (value: Key | null) => {
    const validZone = ZoneSchema.parse(value);
    void setZoneAtom(validZone);
  };

  return (
    <ComboBox value={zone} onChange={onChangeHandler}>
      {zones.map((entry) => (
        <ComboBox.Section key={entry.title} title={entry.title} items={entry.items}>
          {(item) => {
            return <ComboBox.Item id={item.zone}>{item.value}</ComboBox.Item>;
          }}
        </ComboBox.Section>
      ))}
    </ComboBox>
  );
}
