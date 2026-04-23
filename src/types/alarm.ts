export type ChallengeType = 'steps' | 'puzzle' | 'photo';
export type AlarmTone = 'classic' | 'digital' | 'siren' | 'zen' | 'pulse' | 'custom';

export interface Challenge {
  id: string;
  type: ChallengeType;
  target: number | string;
  count: number; // Number of rounds for this specific challenge
}

export interface Alarm {
  id: string;
  time: string; // HH:mm format
  days: number[]; // 0-6 (Sun-Sat)
  enabled: boolean;
  label: string;
  tone: AlarmTone;
  customAudioData?: string; // Base64 data URI for custom sounds
  challenges: Challenge[];
}

export interface AlarmHistory {
  id: string;
  alarmId: string;
  timestamp: Date;
  status: 'dismissed' | 'snoozed';
  timeTaken: number; // seconds
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletionDate: string | null; // YYYY-MM-DD format
  unlockedRewards: string[];
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  targetStreak: number;
  icon: string;
}

export const REWARDS: Reward[] = [
  { id: 'early-bird', title: 'Early Bird', description: 'Complete 3 days in a row', targetStreak: 3, icon: 'Bird' },
  { id: 'week-warrior', title: 'Week Warrior', description: 'Complete 7 days in a row', targetStreak: 7, icon: 'ShieldCheck' },
  { id: 'rise-master', title: 'Rise Master', description: 'Complete 14 days in a row', targetStreak: 14, icon: 'Trophy' },
  { id: 'morning-legend', title: 'Morning Legend', description: 'Complete 30 days in a row', targetStreak: 30, icon: 'Crown' },
];
