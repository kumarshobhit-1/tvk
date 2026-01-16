import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const roundedValue = Math.round(value);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{roundedValue}%</p>
      </div>
      <Progress value={value} />
    </div>
  );
}
