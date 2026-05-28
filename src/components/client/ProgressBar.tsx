interface ProgressBarProps {
  current: number; // 1-based
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round(((current - 1) / total) * 100);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Question {current} of {total}</span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
