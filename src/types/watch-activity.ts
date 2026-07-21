export interface WatchDay {
   date: string;
   weekday: number;
   count: number;
   level: 0 | 1 | 2 | 3 | 4;
}

export interface WatchWeek {
   days: WatchDay[];
}

export interface WatchActivityData {
   weeks: WatchWeek[];
   total: number;
   busiestDay: { date: string; count: number } | null;
   currentStreak: number;
   longestStreak: number;
   maxCount: number;
}
