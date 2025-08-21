import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

export const ProgressDots = ({ total, current, onDotClick }: ProgressDotsProps) => {
  return (
    <div className="flex space-x-2 justify-center">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          className={cn(
            "h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50",
            index === current
              ? "w-8 bg-primary" 
              : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
          aria-label={`Go to card ${index + 1}`}
        />
      ))}
    </div>
  );
};