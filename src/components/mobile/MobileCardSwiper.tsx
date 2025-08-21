import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProgressDots } from './ProgressDots';
import { AIInsightMobileCard } from './cards/AIInsightMobileCard';
import { BriefingCard } from './cards/BriefingCard';
import { CompetitorCard } from './cards/CompetitorCard';
import { IndustryCard } from './cards/IndustryCard';
import { MacroCard } from './cards/MacroCard';
import { CompanyCard } from './cards/CompanyCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileCardSwiperProps {
  competitorName?: string;
  industryName?: string;
}

export const MobileCardSwiper = ({ 
  competitorName = "TechCorp", 
  industryName = "Technology" 
}: MobileCardSwiperProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const cards = [
    { id: 'ai-summary', component: <AIInsightMobileCard /> },
    { id: 'briefing', component: <BriefingCard /> },
    { id: 'competitor', component: <CompetitorCard competitorName={competitorName} /> },
    { id: 'industry', component: <IndustryCard industryName={industryName} /> },
    { id: 'macro', component: <MacroCard /> },
    { id: 'company', component: <CompanyCard /> }
  ];

  const totalCards = cards.length;

  const goToCard = (index: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(Math.max(0, Math.min(index, totalCards - 1)));
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const nextCard = () => {
    if (currentIndex < totalCards - 1) {
      goToCard(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  };

  // Touch/Mouse event handlers
  const handleStart = (clientX: number) => {
    if (isTransitioning) return;
    
    startXRef.current = clientX;
    currentXRef.current = clientX;
    isDraggingRef.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!isDraggingRef.current || isTransitioning) return;
    currentXRef.current = clientX;
  };

  const handleEnd = () => {
    if (!isDraggingRef.current || isTransitioning) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swiped right - go to previous card
        prevCard();
      } else if (deltaX < 0 && currentIndex < totalCards - 1) {
        // Swiped left - go to next card
        nextCard();
      }
    }
    
    isDraggingRef.current = false;
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events (for desktop testing)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'ArrowRight') {
        nextCard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="h-screen flex flex-col bg-dashboard-bg">
      {/* Header with Progress Dots */}
      <div className="flex-shrink-0 px-6 py-4 bg-dashboard-sidebar border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">D</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">Decks</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalCards}
          </div>
        </div>
        
        <ProgressDots 
          total={totalCards} 
          current={currentIndex}
          onDotClick={goToCard}
        />
      </div>

      {/* Card Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDraggingRef.current ? handleMouseMove : undefined}
        onMouseUp={isDraggingRef.current ? handleMouseUp : undefined}
        onMouseLeave={isDraggingRef.current ? handleMouseUp : undefined}
      >
        <div 
          className={cn(
            "flex h-full transition-transform duration-300 ease-out",
            isTransitioning && "transition-transform"
          )}
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${totalCards * 100}%`
          }}
        >
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className="w-full h-full flex-shrink-0"
              style={{ width: `${100 / totalCards}%` }}
            >
              {card.component}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons (Desktop) */}
      <div className="hidden md:flex absolute inset-y-0 left-0 right-0 pointer-events-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevCard}
          disabled={currentIndex === 0 || isTransitioning}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={nextCard}
          disabled={currentIndex === totalCards - 1 || isTransitioning}
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Swipe Hint (only show on first card) */}
      {currentIndex === 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden">
          <div className="flex items-center space-x-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border">
            <span className="text-xs text-muted-foreground">Swipe to navigate</span>
            <div className="flex space-x-1">
              <ChevronLeft className="w-3 h-3 text-muted-foreground animate-pulse" />
              <ChevronRight className="w-3 h-3 text-muted-foreground animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};