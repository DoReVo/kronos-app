import cs from "clsx";

const RootStyle = cs([
  "flex",
  "w-full max-w-xl",
  "items-center justify-between",
  "rounded",
  "bg-card-background",
  "text-text",
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
