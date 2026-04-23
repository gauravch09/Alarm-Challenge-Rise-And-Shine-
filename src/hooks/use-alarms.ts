"use client"

import { useState, useEffect } from 'react';
import { Alarm, Challenge, UserStats, REWARDS } from '@/types/alarm';

const STORAGE_KEY = 'rise_and_shine_alarms_v2';
const STATS_KEY = 'rise_and_shine_stats';
const SETTINGS_KEY = 'rise_and_shine_settings';

export interface AppSettings {
  volume: number;
  vacationMode: boolean;
}

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    volume: 70,
    vacationMode: false
  });
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    lastCompletionDate: null,
    unlockedRewards: []
  });

  // Load data from storage
  useEffect(() => {
    const storedAlarms = localStorage.getItem(STORAGE_KEY);
    if (storedAlarms) {
      try { setAlarms(JSON.parse(storedAlarms)); } catch (e) { console.error(e); }
    }

    const storedStats = localStorage.getItem(STATS_KEY);
    if (storedStats) {
      try { setStats(JSON.parse(storedStats)); } catch (e) { console.error(e); }
    }

    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Check for triggered alarms
  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.vacationMode) return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();

      const triggered = alarms.find(alarm => 
        alarm.enabled && 
        alarm.time === currentTime && 
        now.getSeconds() === 0 &&
        alarm.days.includes(currentDay) &&
        !activeAlarm
      );

      if (triggered) {
        setActiveAlarm(triggered);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, activeAlarm, settings.vacationMode]);

  const addAlarm = (alarmData: Omit<Alarm, 'id'>) => {
    const newAlarm = { ...alarmData, id: Math.random().toString(36).substr(2, 9) };
    setAlarms([...alarms, newAlarm]);
  };

  const updateAlarm = (updated: Alarm) => {
    setAlarms(alarms.map(a => a.id === updated.id ? updated : a));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const dismissActiveAlarm = () => {
    if (activeAlarm) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      setStats(prev => {
        let newStreak = prev.currentStreak;
        const lastDate = prev.lastCompletionDate;

        if (lastDate) {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDate === yesterdayStr) {
            newStreak += 1;
          } else if (lastDate !== todayStr) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        const newLongest = Math.max(prev.longestStreak, newStreak);
        const newlyUnlocked = REWARDS
          .filter(r => newStreak >= r.targetStreak && !prev.unlockedRewards.includes(r.id))
          .map(r => r.id);

        return {
          ...prev,
          currentStreak: lastDate === todayStr ? prev.currentStreak : newStreak,
          longestStreak: newLongest,
          totalCompletions: lastDate === todayStr ? prev.totalCompletions : prev.totalCompletions + 1,
          lastCompletionDate: todayStr,
          unlockedRewards: Array.from(new Set([...prev.unlockedRewards, ...newlyUnlocked]))
        };
      });
    }
    setActiveAlarm(null);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return {
    alarms,
    activeAlarm,
    stats,
    settings,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    updateSettings,
    dismissActiveAlarm,
    setActiveAlarm 
  };
}