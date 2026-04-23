"use client"

import { Info, AlertTriangle, Battery, Globe, Power, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function ReliabilityNotice() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors gap-2">
          <Info className="w-4 h-4" />
          Reliability Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] sm:max-w-md max-h-[90vh] overflow-y-auto border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary">Wake-up Requirements</DialogTitle>
          <DialogDescription className="text-base font-medium">
            Essential steps to ensure your alarm works every morning.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 mt-4 rounded-2xl">
          <Power className="h-4 w-4" />
          <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Power Requirement</AlertTitle>
          <AlertDescription className="text-xs font-bold leading-relaxed">
            Apps cannot run if a phone is switched OFF. Software cannot bypass hardware power states for security and safety reasons.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl h-fit">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Keep Tab Open</h4>
              <p className="text-sm text-muted-foreground">The browser tab must remain open. On mobile, do not "Force Close" your browser app before bed.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-accent/10 p-3 rounded-2xl h-fit">
              <ShieldAlert className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">"Soft Lock" Protection</h4>
              <p className="text-sm text-muted-foreground">When the alarm triggers, we use Fullscreen and Navigation Interception to prevent you from accidentally exiting the tasks.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl h-fit">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Silent Mode / Volume</h4>
              <p className="text-sm text-muted-foreground">Ensure your media volume is high. Most browsers block audio until you have interacted with the page at least once.</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 p-5 rounded-3xl border border-border/50">
          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            The "App" Advantage
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            Use the "Add to Home Screen" feature. Installed PWAs are prioritized by the operating system and are much less likely to be closed in the background.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}