import cs from "clsx";

const RootStyle = cs([
  "flex",
  "w-full",
  "items-center justify-between",
  "rounded",
  "border border-card-border",
  "text-card-text",
  "p-4 text-2xl",
]);

interface Props {
  name: string;
  time: string;
}

export function TimeCard(props: Props) {
  return (
    <div className={RootStyle}>
      <div>{props.name.toUpperCase()}</div>
      <div>{props.time}</div>
    </div>
  );
}
