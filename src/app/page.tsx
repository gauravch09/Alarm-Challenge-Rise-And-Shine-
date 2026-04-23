"use client"

import { useState, useEffect } from 'react';
import { useAlarms } from '@/hooks/use-alarms';
import { AlarmCard } from '@/components/AlarmCard';
import { AlarmForm } from '@/components/AlarmForm';
import { ActiveAlarmOverlay } from '@/components/ActiveAlarmOverlay';
import { ReliabilityNotice } from '@/components/ReliabilityNotice';
import { Sun, History, Settings, Bell, TrendingUp, Moon, Trophy, ShieldCheck, Bird, Crown, Star, Volume2, Plane, Trash2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { REWARDS } from '@/types/alarm';
import { toast } from '@/hooks/use-toast';

const RewardIcons: Record<string, any> = {
  Bird: Bird,
  ShieldCheck: ShieldCheck,
  Trophy: Trophy,
  Crown: Crown,
};

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const { 
    alarms, 
    activeAlarm, 
    stats,
    settings,
    addAlarm, 
    deleteAlarm, 
    toggleAlarm, 
    dismissActiveAlarm,
    setActiveAlarm,
    updateSettings
  } = useAlarms();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleTestSound = () => {
    toast({
      title: "Testing Alarm Volume",
      description: `Alarm sound will play at ${settings.volume}% volume.`,
    });
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to reset your progress and rewards? This cannot be undone.")) {
      localStorage.removeItem('rise_and_shine_stats');
      window.location.reload();
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 transition-colors duration-500">
      {activeAlarm && (
        <ActiveAlarmOverlay 
          alarm={activeAlarm} 
          maxVolume={settings.volume}
          onDismiss={dismissActiveAlarm} 
        />
      )}

      <header className="px-6 pt-12 pb-8 flex justify-between items-center bg-card/50 backdrop-blur-xl sticky top-0 z-10 border-b border-primary/5">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-primary/40">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary transition-all group-hover:translate-x-1">Rise & Shine</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Challenge Alarm</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full bg-card shadow-sm border border-border hover:bg-primary/10 hover:text-primary transition-all hover:scale-110"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-card shadow-sm border border-border hover:bg-primary/10 hover:text-primary transition-all hover:scale-110">
                <Settings className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="rounded-l-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-8 space-y-10 pb-20">
                  <SheetHeader>
                    <SheetTitle className="text-3xl font-black text-primary">App Settings</SheetTitle>
                    <SheetDescription className="font-bold text-muted-foreground">Configure your wake-up experience</SheetDescription>
                  </SheetHeader>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-primary" />
                          Max Alarm Volume
                        </Label>
                        <span className="text-sm font-black text-primary">{settings.volume}%</span>
                      </div>
                      <Slider 
                        value={[settings.volume]} 
                        onValueChange={(val) => updateSettings({ volume: val[0] })} 
                        max={100} 
                        step={1} 
                        className="py-2"
                      />
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase leading-tight">
                          <span className="opacity-60">Note:</span> Alarms will gradually increase to this level over 30 seconds.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleTestSound} className="w-full rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5">
                        <BellRing className="w-4 h-4 mr-2" />
                        Test Sound
                      </Button>
                    </div>

                    <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 flex items-center justify-between group transition-all hover:border-primary/20 hover:bg-muted/50">
                      <div className="space-y-1">
                        <Label className="text-sm font-black flex items-center gap-2">
                          <Plane className="w-4 h-4 text-accent" />
                          Vacation Mode
                        </Label>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Pauses all active alarms</p>
                      </div>
                      <Switch 
                        checked={settings.vacationMode} 
                        onCheckedChange={(val) => updateSettings({ vacationMode: val })}
                        className="data-[state=checked]:bg-accent transition-transform group-hover:scale-110"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">General</Label>
                      <div className="space-y-2">
                        <ReliabilityNotice />
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-destructive">Danger Zone</Label>
                      <Button 
                        variant="ghost" 
                        onClick={clearHistory}
                        className="w-full justify-start text-destructive font-bold hover:bg-destructive/5 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Progress & Rewards
                      </Button>
                    </div>
                  </div>

                  <div className="pt-10 text-center space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Rise & Shine v2.2.0</p>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="px-6 mt-8 max-w-2xl mx-auto">
        <Tabs defaultValue="alarms" className="w-full">
          <TabsList className="grid grid-cols-2 bg-muted/30 p-1.5 rounded-2xl h-14 mb-8">
            <TabsTrigger value="alarms" className="rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all hover:bg-card/50">
              <Bell className="w-4 h-4 mr-2" />
              Alarms
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all hover:bg-card/50">
              <History className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alarms" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                My Alarms 
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">
                  {alarms.length}
                </span>
              </h2>
              {settings.vacationMode && (
                <div className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                  <Plane className="w-3 h-3" />
                  Vacation Mode Active
                </div>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-320px)] pr-4 -mr-4">
              <div className="space-y-4 pb-20">
                {alarms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="bg-muted/20 p-10 rounded-full transition-all hover:scale-110 hover:bg-muted/30">
                      <Bell className="w-16 h-16 text-muted-foreground opacity-20" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-muted-foreground">No alarms set</h3>
                    </div>
                  </div>
                ) : (
                  alarms.map(alarm => (
                    <AlarmCard 
                      key={alarm.id} 
                      alarm={alarm} 
                      onToggle={() => toggleAlarm(alarm.id)}
                      onDelete={() => deleteAlarm(alarm.id)}
                      onSimulate={() => setActiveAlarm(alarm)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="bg-card p-8 rounded-[2.5rem] text-center space-y-6 shadow-sm border border-border transition-all hover:shadow-xl hover:border-accent/30 group">
              <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110 group-hover:rotate-12">
                <TrendingUp className="w-12 h-12 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tight">Morning Streak: {stats.currentStreak} Days</h3>
                <p className="text-muted-foreground">
                  {stats.currentStreak > 0 
                    ? `You're on fire! Keep going to unlock more rewards.` 
                    : `Start your morning strong to begin your streak!`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-muted/20 p-6 rounded-3xl transition-all hover:bg-primary/5 hover:scale-105">
                  <div className="text-3xl font-black text-primary">{stats.totalCompletions}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Wakes</div>
                </div>
                <div className="bg-muted/20 p-6 rounded-3xl transition-all hover:bg-accent/5 hover:scale-105">
                  <div className="text-3xl font-black text-accent">{stats.longestStreak}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Best Streak</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2 px-2">
                Unlocked Rewards
                <Star className="w-5 h-5 text-primary fill-primary" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {REWARDS.map((reward) => {
                  const Icon = RewardIcons[reward.icon] || Star;
                  const isUnlocked = stats.unlockedRewards.includes(reward.id);
                  return (
                    <div 
                      key={reward.id} 
                      className={`p-5 rounded-3xl border-2 transition-all flex items-center gap-4 ${
                        isUnlocked 
                          ? 'bg-card border-primary/20 shadow-md shadow-primary/5' 
                          : 'bg-muted/30 border-transparent opacity-50 grayscale'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-sm">{reward.title}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{reward.description}</p>
                      </div>
                      {isUnlocked && (
                        <div className="ml-auto bg-accent/10 text-accent p-1.5 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-accent" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlarmForm onSave={addAlarm} />
    </main>
  );
}
