import cs from "clsx";

const RootStyle = (className?: string) =>
  cs([
    "uno-layer-base:text-#3A015C uno-layer-base:text-lg",
    "uno-layer-base:i-lucide-loader-circle",
    "uno-layer-base:animate-spin",
    className,
  ]);

export function Spinner({ className }: { className?: string }) {
  return <div className={RootStyle(className)} />;
}
