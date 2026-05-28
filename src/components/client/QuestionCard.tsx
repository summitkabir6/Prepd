interface QuestionCardProps {
  questionText: string;
  questionNumber: number;
}

export function QuestionCard({ questionText, questionNumber }: QuestionCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Question {questionNumber}
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold leading-relaxed text-foreground">
        {questionText}
      </h2>
    </div>
  );
}
