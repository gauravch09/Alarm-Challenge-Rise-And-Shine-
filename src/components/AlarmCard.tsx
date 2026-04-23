"use client"

import { Alarm } from '@/types/alarm';
import { Switch } from './ui/switch';
import { Footprints, Puzzle, Camera, MoreVertical, Trash2, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AlarmCard({ 
  alarm, 
  onToggle, 
  onDelete, 
  onSimulate 
}: { 
  alarm: Alarm, 
  onToggle: () => void, 
  onDelete: () => void,
  onSimulate?: () => void
}) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'steps': return Footprints;
      case 'puzzle': return Puzzle;
      case 'photo': return Camera;
      default: return Layers;
    }
  };

  const getLabel = (challenge: any) => {
    switch (challenge.type) {
      case 'steps': return `${challenge.target} steps`;
      case 'puzzle': return `${challenge.target} puzzle`;
      case 'photo': return 'photo verification';
      default: return 'task';
    }
  };

  return (
    <div className={`group relative bg-card rounded-3xl p-6 shadow-sm border border-border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 ${!alarm.enabled && 'opacity-70 grayscale-[0.2]'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-4xl font-black text-primary tracking-tighter mb-1 transition-transform group-hover:scale-105 origin-left">
            {alarm.time}
          </div>
          <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
            {alarm.label}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={alarm.enabled} 
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-primary transition-transform hover:scale-110"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-2 border-2">
              <DropdownMenuItem onClick={onSimulate} className="text-primary font-bold cursor-pointer rounded-lg hover:bg-primary/5">
                Test Alarm Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive font-bold cursor-pointer rounded-lg hover:bg-destructive/5">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Alarm
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {alarm.challenges.map((challenge) => {
            const Icon = getIcon(challenge.type);
            return (
              <Badge key={challenge.id} variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg px-2.5 py-1 flex items-center gap-1.5 font-bold text-[10px] transition-all hover:bg-primary/10 hover:scale-105">
                <Icon className="w-3 h-3" />
                {challenge.count > 1 ? `${challenge.count}x ` : ''}
                {getLabel(challenge)}
              </Badge>
            );
          })}
        </div>
        
        <div className="flex gap-1.5">
          {DAY_LABELS.map((day, idx) => (
            <div 
              key={idx}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${alarm.days.includes(idx) ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-110' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
