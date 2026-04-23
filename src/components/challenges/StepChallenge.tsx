"use client"

import { useState, useEffect } from 'react';
import { Footprints, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function StepChallenge({ target, onComplete }: { target: number, onComplete: () => void }) {
  const [steps, setSteps] = useState(0);

  // In a real app, this would use the accelerometer/sensor API
  // Here we simulate steps with a button or auto-increment for demo
  const incrementStep = () => {
    if (steps < target) {
      setSteps(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (steps >= target) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [steps, target, onComplete]);

  const progress = (steps / target) * 100;

  return (
    <div className="flex flex-col items-center gap-8 py-10 w-full">
      <div className="relative">
        <div className="w-48 h-48 rounded-full border-8 border-muted flex items-center justify-center bg-card shadow-xl">
          <div className="text-center">
            <Footprints className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
            <div className="text-4xl font-bold text-primary">{steps}</div>
            <div className="text-sm text-muted-foreground">/ {target} steps</div>
          </div>
        </div>
        {steps >= target && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90 rounded-full animate-in fade-in zoom-in">
            <CheckCircle2 className="w-24 h-24 text-accent" />
          </div>
        )}
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Progress value={progress} className="h-4 bg-muted" />
        <p className="text-center text-muted-foreground font-medium">
          {steps >= target ? "Goal reached! Get ready to start your day." : "Walk around your room to stop the alarm."}
        </p>
      </div>

      <Button 
        onClick={incrementStep} 
        disabled={steps >= target}
        variant="outline"
        className="w-full max-w-xs py-8 text-lg font-bold border-2"
      >
        Simulate Step
      </Button>
    </div>
  );
}
