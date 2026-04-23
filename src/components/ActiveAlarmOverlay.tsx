
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { Alarm } from '@/types/alarm';
import { StepChallenge } from './challenges/StepChallenge';
import { PuzzleChallenge } from './challenges/PuzzleChallenge';
import { PhotoChallenge } from './challenges/PhotoChallenge';
import { Bell, ShieldAlert, Maximize2, Volume2, Music, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

export function ActiveAlarmOverlay({ alarm, maxVolume, onDismiss }: { alarm: Alarm, maxVolume: number, onDismiss: () => void }) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [currentVolumeFactor, setCurrentVolumeFactor] = useState(0.05); 
  const wakeLockRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Expanded task sequence to handle multiple challenges and repetitions
  const taskSequence = useMemo(() => {
    const tasks: { type: string; target: any; id: string; }[] = [];
    alarm.challenges.forEach((challenge) => {
      for (let i = 0; i < (challenge.count || 1); i++) {
        tasks.push({
          id: `${challenge.id}-${i}`,
          type: challenge.type,
          target: challenge.target,
        });
      }
    });
    return tasks;
  }, [alarm.challenges]);

  useEffect(() => {
    const startAudio = () => {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const gainNode = ctx.createGain();
        gainNode.gain.value = (maxVolume / 100) * currentVolumeFactor;
        gainNode.connect(ctx.destination);
        gainNodeRef.current = gainNode;

        if (alarm.tone === 'custom' && alarm.customAudioData) {
          const audio = new Audio(alarm.customAudioData);
          audio.loop = true;
          const source = ctx.createMediaElementSource(audio);
          source.connect(gainNode);
          audio.play();
          customAudioRef.current = audio;
          return;
        }

        const playTone = () => {
          if (!audioContextRef.current || !gainNodeRef.current || customAudioRef.current) return;
          const osc = audioContextRef.current.createOscillator();
          const now = audioContextRef.current.currentTime;
          
          switch (alarm.tone) {
            case 'digital':
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1500, now);
              osc.start(now);
              osc.stop(now + 0.05);
              setTimeout(playTone, 200);
              break;
            case 'siren':
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(440, now);
              osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
              osc.frequency.exponentialRampToValueAtTime(440, now + 1.0);
              osc.start(now);
              osc.stop(now + 1.0);
              setTimeout(playTone, 1000);
              break;
            case 'zen':
              osc.type = 'sine';
              osc.frequency.setValueAtTime(220, now);
              osc.start(now);
              osc.stop(now + 0.8);
              setTimeout(playTone, 1200);
              break;
            case 'pulse':
              osc.type = 'square';
              osc.frequency.setValueAtTime(60, now);
              osc.start(now);
              osc.stop(now + 0.02);
              setTimeout(playTone, 100);
              break;
            case 'classic':
            default:
              osc.type = 'square';
              osc.frequency.setValueAtTime(880, now);
              osc.start(now);
              osc.stop(now + 0.1);
              setTimeout(playTone, 500);
              break;
          }
          osc.connect(gainNodeRef.current);
        };

        playTone();
      } catch (err) {
        console.warn('Audio start failed', err);
      }
    };

    startAudio();

    const volumeInterval = setInterval(() => {
      setCurrentVolumeFactor(prev => {
        const next = Math.min(prev + 0.02, 1.0); 
        if (gainNodeRef.current && audioContextRef.current) {
          gainNodeRef.current.gain.linearRampToValueAtTime(
            (maxVolume / 100) * next,
            audioContextRef.current.currentTime + 0.5
          );
        }
        return next;
      });
    }, 1000);

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('WakeLock failed', err);
      }
    };
    requestWakeLock();

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowExitWarning(true);
      setTimeout(() => setShowExitWarning(false), 3000);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(volumeInterval);
      if (wakeLockRef.current) wakeLockRef.current.release();
      if (audioContextRef.current) audioContextRef.current.close();
      if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.src = "";
      }
    };
  }, [maxVolume, alarm.tone, alarm.customAudioData]);

  const handleTaskComplete = () => {
    const nextIndex = currentTaskIndex + 1;
    if (nextIndex >= taskSequence.length) {
      onDismiss();
    } else {
      setCurrentTaskIndex(nextIndex);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error('Fullscreen failed', err));
    } else {
      document.exitFullscreen().catch((err) => console.error('Exit fullscreen failed', err));
    }
  };

  const renderChallenge = () => {
    const currentTask = taskSequence[currentTaskIndex];
    if (!currentTask) return null;

    const key = `task-${currentTask.id}`;
    
    switch (currentTask.type) {
      case 'steps':
        return <StepChallenge key={key} target={Number(currentTask.target) || 50} onComplete={handleTaskComplete} />;
      case 'puzzle':
        return <PuzzleChallenge key={key} difficulty={String(currentTask.target) || 'medium'} onComplete={handleTaskComplete} />;
      case 'photo':
        return <PhotoChallenge key={key} targetId={String(currentTask.target)} onComplete={handleTaskComplete} />;
      default:
        return <Button onClick={onDismiss}>Dismiss</Button>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden animate-in fade-in">
      <div className="bg-destructive text-white py-3 px-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 animate-bounce" />
          <span className="text-sm font-black tracking-tighter uppercase">ALARM TRIGGERED</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
            <Volume2 className="w-4 h-4" />
            <span className="text-[10px] font-black tabular-nums">{Math.round(maxVolume * currentVolumeFactor)}%</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 text-white">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="text-7xl font-black text-primary tracking-tighter mb-1 tabular-nums">
            {alarm.time}
          </div>
          <h1 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">{alarm.label}</h1>
          
          <div className="mt-6 flex justify-center gap-1.5">
            {taskSequence.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-500 ${idx === currentTaskIndex ? 'bg-primary w-12 shadow-[0_0_10px_rgba(var(--primary),0.5)]' : idx < currentTaskIndex ? 'bg-accent w-6' : 'bg-muted w-6'}`}
              >
                {idx < currentTaskIndex && <CheckCircle2 className="w-2 h-2 text-white mx-auto mt-[1px]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col items-center justify-center max-w-lg bg-card/40 rounded-[3rem] p-6 backdrop-blur-md border border-border/50 shadow-inner">
          {renderChallenge()}
        </div>
      </div>

      {showExitWarning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-destructive text-white px-8 py-4 rounded-2xl shadow-2xl font-black z-[110] flex flex-col items-center gap-2 animate-in zoom-in text-center border-2 border-white/20">
          <ShieldAlert className="w-10 h-10 mb-1" />
          <div className="text-lg uppercase">Challenges Required</div>
          <div className="text-[10px] opacity-80 uppercase tracking-widest">Navigation disabled until routine is complete</div>
        </div>
      )}

      <div className="p-8 bg-muted/30 border-t border-border/50 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-75" />
          </div>
          Crescendo Engine Active
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-75" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-center">
          The sound will intensify until your brain is fully activated.
        </p>
      </div>
    </div>
  );
}
