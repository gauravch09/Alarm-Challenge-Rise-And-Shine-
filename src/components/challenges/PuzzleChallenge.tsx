"use client"

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, RefreshCw, BrainCircuit, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateMathPuzzle, GenerateMathPuzzleOutput } from '@/ai/flows/generate-math-puzzle';
import { Progress } from '@/components/ui/progress';

const ALL_LEVEL_METADATA = [
  { level: 'easy', label: 'Warm-up' },
  { level: 'medium', label: 'Focus' },
  { level: 'hard', label: 'Peak Performance' }
];

export function PuzzleChallenge({ difficulty, onComplete }: { difficulty: string, onComplete: () => void }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<GenerateMathPuzzleOutput | null>(null);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [solvedAll, setSolvedAll] = useState(false);
  const [stageTransition, setStageTransition] = useState(false);

  // Parse multi-level selection (e.g., "easy,hard")
  const stages = useMemo(() => {
    const selectedLevels = difficulty.split(',').filter(Boolean);
    return ALL_LEVEL_METADATA.filter(m => selectedLevels.includes(m.level));
  }, [difficulty]);

  const fetchPuzzle = async (level: string) => {
    setLoading(true);
    setError(false);
    setUserInput('');
    try {
      const result = await generateMathPuzzle({ difficulty: level });
      setPuzzle(result);
    } catch (e) {
      console.error(e);
      // Fallback values in case of AI failure
      const fallbacks: Record<string, GenerateMathPuzzleOutput> = {
        easy: { question: "12 + 15", answer: 27 },
        medium: { question: "7 * 8", answer: 56 },
        hard: { question: "14 * 4", answer: 56 }
      };
      setPuzzle(fallbacks[level] || fallbacks.easy);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stages[currentStageIndex]) {
      fetchPuzzle(stages[currentStageIndex].level);
    }
  }, [currentStageIndex, stages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzle) return;

    if (parseInt(userInput) === puzzle.answer) {
      if (currentStageIndex === stages.length - 1) {
        setSolvedAll(true);
        setTimeout(onComplete, 1500);
      } else {
        setStageTransition(true);
        setTimeout(() => {
          setStageTransition(false);
          setCurrentStageIndex(prev => prev + 1);
        }, 1000);
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  const progress = ((currentStageIndex) / stages.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto relative group">
          <BrainCircuit className="w-10 h-10 text-primary transition-transform group-hover:scale-110" />
          {stages.length > 1 && (
            <div className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              STAGE {currentStageIndex + 1}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-black tracking-tight">
          {stages.length > 1 ? "Brain Activation" : "Quick Challenge"}
        </h2>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
          {stages[currentStageIndex]?.label || "Processing"} Mode
        </p>
      </div>

      {stages.length > 1 && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
            <span>Cognitive Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted/50" />
        </div>
      )}

      <div className="w-full bg-card p-8 rounded-[2.5rem] shadow-xl border-2 border-primary/10 relative min-h-[240px] flex flex-col justify-center items-center transition-all">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Calculating...</p>
          </div>
        ) : solvedAll ? (
          <div className="flex flex-col items-center gap-3 text-accent animate-in zoom-in duration-500">
            <div className="bg-accent/10 p-4 rounded-full">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <p className="text-2xl font-black tracking-tight">Awakened!</p>
          </div>
        ) : stageTransition ? (
          <div className="flex flex-col items-center gap-3 text-primary animate-in fade-in slide-in-from-right-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <ArrowRight className="w-12 h-12" />
            </div>
            <p className="text-xl font-black uppercase tracking-tight">Level Up!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/5 rounded-2xl border border-dashed border-primary/20">
                <p className="text-3xl sm:text-4xl font-black text-primary tracking-tight leading-tight tabular-nums">
                  {puzzle?.question}
                </p>
              </div>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="?"
                className={`text-center text-4xl h-24 font-black rounded-[1.5rem] transition-all duration-300 ${error ? 'border-destructive bg-destructive/10 animate-shake ring-4 ring-destructive/20' : 'border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/20'}`}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-16 text-xl font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              Verify Solution
            </Button>
          </form>
        )}
      </div>

      {!solvedAll && !loading && (
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => fetchPuzzle(stages[currentStageIndex].level)} 
            disabled={loading || solvedAll || stageTransition}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary rounded-full px-4"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            New Problem
          </Button>
        </div>
      )}
    </div>
  );
}
