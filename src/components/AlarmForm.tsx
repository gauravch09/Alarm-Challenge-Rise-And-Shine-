"use client"

import { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Footprints, Puzzle, Camera, Hash, Play, Upload, Check, ChevronRight, MapPin, X, RefreshCw } from 'lucide-react';
import { AlarmTone, Challenge } from '@/types/alarm';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from './ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PUZZLE_LEVELS = ['easy', 'medium', 'hard'];

export function AlarmForm({ onSave }: { onSave: (alarm: any) => void }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Wake Up');
  const [tone, setTone] = useState<AlarmTone>('classic');
  const [customAudioData, setCustomAudioData] = useState<string | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  
  const [routine, setRoutine] = useState({
    steps: { enabled: false, target: 50 },
    puzzle: { enabled: true, levels: ['medium'], count: 1 },
    photo: { 
      enabled: false, 
      targetId: PlaceHolderImages[0].id, 
      isCustom: false, 
      customLabel: '',
      referenceImage: null as string | null 
    }
  });

  const [isCapturingReference, setIsCapturingReference] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: "File too large",
          description: "Please select an audio file smaller than 2MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomAudioData(event.target?.result as string);
        setTone('custom');
        toast({
          title: "Audio Uploaded",
          description: `${file.name} is now your alarm tone.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturingReference(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      
      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' } 
        } 
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Back camera failed, falling back to any camera', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Video play failed", e);
        }
      }
      setIsCapturingReference(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast({
        variant: 'destructive',
        title: "Camera Error",
        description: "Could not access camera for reference photo.",
      });
    }
  };

  const captureReference = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setRoutine(prev => ({
        ...prev,
        photo: { ...prev.photo, referenceImage: dataUrl, isCustom: true, customLabel: 'Custom Photo' }
      }));
      stopCamera();
    }
  };

  const playPreview = () => {
    if (tone === 'custom' && customAudioData) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      const audio = new Audio(customAudioData);
      audio.volume = 0.5;
      audio.play();
      previewAudioRef.current = audio;
      return;
    }

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      switch(tone) {
        case 'digital': osc.type = 'sine'; osc.frequency.setValueAtTime(1500, ctx.currentTime); break;
        case 'siren': osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); break;
        case 'zen': osc.type = 'sine'; osc.frequency.setValueAtTime(220, ctx.currentTime); break;
        case 'pulse': osc.type = 'square'; osc.frequency.setValueAtTime(40, ctx.currentTime); break;
        default: osc.type = 'square'; osc.frequency.setValueAtTime(880, ctx.currentTime); break;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch(e) {
      console.error('Tone preview failed', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const challenges: Challenge[] = [];
    if (routine.steps.enabled) {
      challenges.push({ id: 'steps-stage', type: 'steps', target: routine.steps.target, count: 1 });
    }
    if (routine.puzzle.enabled && routine.puzzle.levels.length > 0) {
      challenges.push({ 
        id: 'puzzle-stage', 
        type: 'puzzle', 
        target: routine.puzzle.levels.join(','), 
        count: routine.puzzle.count 
      });
    }
    if (routine.photo.enabled) {
      const finalTarget = routine.photo.referenceImage || (routine.photo.isCustom ? routine.photo.customLabel : routine.photo.targetId);
      if ((routine.photo.isCustom && !routine.photo.customLabel.trim()) && !routine.photo.referenceImage) {
        toast({
          variant: 'destructive',
          title: "Custom target missing",
          description: "Please specify what needs to be photographed or capture a photo.",
        });
        return;
      }
      challenges.push({ id: 'photo-stage', type: 'photo', target: finalTarget, count: 1 });
    }

    if (challenges.length === 0) {
      toast({
        variant: 'destructive',
        title: "No challenges selected",
        description: "Please enable at least one stage for your wake-up routine.",
      });
      return;
    }

    onSave({
      time,
      label,
      tone,
      customAudioData,
      challenges,
      days: selectedDays,
      enabled: true
    });
    setOpen(false);
  };

  const togglePuzzleLevel = (level: string) => {
    setRoutine(prev => {
      const nextLevels = prev.puzzle.levels.includes(level)
        ? prev.puzzle.levels.filter(l => l !== level)
        : [...prev.puzzle.levels, level].sort((a, b) => PUZZLE_LEVELS.indexOf(a) - PUZZLE_LEVELS.indexOf(b));
      return { ...prev, puzzle: { ...prev.puzzle, levels: nextLevels } };
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) stopCamera();
      setOpen(val);
    }}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-10 right-1/2 translate-x-1/2 rounded-full h-16 px-8 shadow-2xl shadow-primary/40 text-lg font-bold gap-2 z-50 transition-all hover:scale-105 active:scale-95 hover:shadow-primary/60">
          <Plus className="w-6 h-6" />
          Set New Alarm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-black text-center text-primary">Routine Designer</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Wake-up Time</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={time} 
                  onChange={e => setTime(e.target.value)}
                  className="h-20 text-5xl font-black text-primary border-2 border-primary/10 rounded-2xl text-center px-4 focus:border-primary focus:ring-0 transition-all bg-muted/10"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Repeat On</Label>
                <div className="flex justify-between items-center gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-11 h-11 rounded-full text-xs font-black transition-all duration-200 hover:scale-110 active:scale-90 ${selectedDays.includes(idx) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Label</Label>
                  <Input 
                    id="label" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)}
                    placeholder="Morning Rise"
                    className="h-12 border-2 border-primary/10 rounded-xl font-bold focus:border-primary focus:ring-0 bg-muted/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Sound</Label>
                  <div className="flex gap-2">
                    <Select value={tone} onValueChange={(v: AlarmTone) => setTone(v)}>
                      <SelectTrigger className="h-12 border-2 border-primary/10 rounded-xl font-bold focus:border-primary focus:ring-0 bg-muted/5 transition-all flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="classic" className="font-bold">Classic</SelectItem>
                        <SelectItem value="digital" className="font-bold">Digital</SelectItem>
                        <SelectItem value="siren" className="font-bold">Siren</SelectItem>
                        <SelectItem value="zen" className="font-bold">Zen</SelectItem>
                        <SelectItem value="pulse" className="font-bold">Pulse</SelectItem>
                        <SelectItem value="custom" className="font-bold" disabled={!customAudioData}>
                          {customAudioData ? "Custom File" : "Upload..."}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={playPreview}
                      className="h-12 w-12 rounded-xl border-primary/10 hover:bg-primary/5"
                    >
                      <Play className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Custom Audio</Label>
                <div className="flex items-center gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className={`w-full h-12 rounded-xl border-2 border-dashed font-bold transition-all ${customAudioData ? 'border-accent/30 bg-accent/5 text-accent' : 'border-primary/10 hover:border-primary/30'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {customAudioData ? <><Check className="w-4 h-4 mr-2" /> Sound Ready</> : <><Upload className="w-4 h-4 mr-2" /> Select MP3/WAV</>}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Wake-up Routine Stages</Label>
              
              <div className="space-y-4">
                {/* Steps Stage */}
                <div className={cn(
                  "p-5 rounded-3xl border-2 transition-all space-y-4",
                  routine.steps.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-transparent opacity-60"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", routine.steps.enabled ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Footprints className="w-5 h-5" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-tight">Active Walking</span>
                    </div>
                    <Switch 
                      checked={routine.steps.enabled} 
                      onCheckedChange={(val) => setRoutine(prev => ({ ...prev, steps: { ...prev.steps, enabled: val } }))}
                    />
                  </div>
                  {routine.steps.enabled && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Step Count</Label>
                      <Input 
                        type="number" 
                        value={routine.steps.target} 
                        onChange={e => setRoutine(prev => ({ ...prev, steps: { ...prev.steps, target: parseInt(e.target.value) || 0 } }))}
                        className="h-10 border-primary/10 rounded-xl font-black"
                      />
                    </div>
                  )}
                </div>

                {/* Puzzle Stage */}
                <div className={cn(
                  "p-5 rounded-3xl border-2 transition-all space-y-4",
                  routine.puzzle.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-transparent opacity-60"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", routine.puzzle.enabled ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Puzzle className="w-5 h-5" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-tight">Brain Puzzles</span>
                    </div>
                    <Switch 
                      checked={routine.puzzle.enabled} 
                      onCheckedChange={(val) => setRoutine(prev => ({ ...prev, puzzle: { ...prev.puzzle, enabled: val } }))}
                    />
                  </div>
                  {routine.puzzle.enabled && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Complexity Levels</Label>
                        <div className="flex gap-1.5 bg-muted/30 p-1 rounded-xl w-full">
                          {PUZZLE_LEVELS.map(level => {
                            const isSelected = routine.puzzle.levels.includes(level);
                            return (
                              <Button
                                key={level}
                                type="button"
                                variant={isSelected ? "default" : "ghost"}
                                size="sm"
                                onClick={() => togglePuzzleLevel(level)}
                                className={cn(
                                  "flex-1 capitalize text-[10px] h-9 rounded-lg font-black transition-all",
                                  isSelected ? "bg-primary text-white" : "text-muted-foreground hover:bg-primary/5"
                                )}
                              >
                                {level}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Repetitions Per Stage</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input 
                            type="number" 
                            min="1"
                            value={routine.puzzle.count} 
                            onChange={e => setRoutine(prev => ({ ...prev, puzzle: { ...prev.puzzle, count: parseInt(e.target.value) || 1 } }))}
                            className="h-10 pl-9 border-primary/10 rounded-xl font-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Stage */}
                <div className={cn(
                  "p-5 rounded-3xl border-2 transition-all space-y-4",
                  routine.photo.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-transparent opacity-60"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", routine.photo.enabled ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-tight">Location Verification</span>
                    </div>
                    <Switch 
                      checked={routine.photo.enabled} 
                      onCheckedChange={(val) => setRoutine(prev => ({ ...prev, photo: { ...prev.photo, enabled: val } }))}
                    />
                  </div>
                  {routine.photo.enabled && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Verification Target</Label>
                        <Select 
                          value={routine.photo.referenceImage ? 'custom-photo' : (routine.photo.isCustom ? 'custom' : routine.photo.targetId)} 
                          onValueChange={v => {
                            if (v === 'custom') {
                              setRoutine(prev => ({ ...prev, photo: { ...prev.photo, isCustom: true, referenceImage: null } }));
                            } else if (v === 'custom-photo') {
                              startCamera();
                            } else {
                              setRoutine(prev => ({ ...prev, photo: { ...prev.photo, isCustom: false, targetId: v, referenceImage: null } }));
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 border-primary/10 rounded-xl font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {PlaceHolderImages.map(img => (
                              <SelectItem key={img.id} value={img.id} className="font-bold">{img.description}</SelectItem>
                            ))}
                            <SelectItem value="custom" className="font-bold text-primary italic">Custom Target Name...</SelectItem>
                            <SelectItem value="custom-photo" className="font-bold text-accent italic">Capture Reference Photo...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {isCapturingReference && (
                        <div className="space-y-2 animate-in fade-in zoom-in">
                          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-accent">
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className="w-full h-full object-cover" 
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <Button 
                              type="button" 
                              onClick={captureReference} 
                              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full h-12 w-12 p-0 bg-accent hover:bg-accent/80 border-4 border-white shadow-xl"
                            >
                              <div className="w-4 h-4 rounded-full bg-white" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={stopCamera} 
                              className="absolute top-2 right-2 text-white bg-black/50 rounded-full hover:bg-black"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-[9px] text-accent font-black uppercase text-center">Capture what you'll need to photograph to stop the alarm</p>
                        </div>
                      )}

                      {routine.photo.referenceImage && !isCapturingReference && (
                        <div className="space-y-2 animate-in fade-in">
                          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-accent group">
                            <img src={routine.photo.referenceImage} className="w-full h-full object-cover" alt="Reference" />
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => setRoutine(prev => ({ ...prev, photo: { ...prev.photo, referenceImage: null, isCustom: false, targetId: PlaceHolderImages[0].id } }))}
                              className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <div className="absolute inset-0 bg-accent/20 pointer-events-none flex items-center justify-center">
                              <Check className="text-white w-10 h-10 drop-shadow-md" />
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={startCamera} 
                            className="w-full rounded-xl border-accent/20 text-accent font-bold"
                          >
                            <RefreshCw className="w-3 h-3 mr-2" /> Retake Reference Photo
                          </Button>
                        </div>
                      )}

                      {routine.photo.isCustom && !routine.photo.referenceImage && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Custom Object/Location Name</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                            <Input 
                              placeholder="e.g. Blue Mailbox, Kitchen Sink, My Office"
                              value={routine.photo.customLabel}
                              onChange={e => setRoutine(prev => ({ ...prev, photo: { ...prev.photo, customLabel: e.target.value } }))}
                              className="h-10 pl-9 border-primary/20 focus:border-primary rounded-xl font-bold text-xs bg-card shadow-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-16 rounded-3xl text-xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Deploy Routine <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
