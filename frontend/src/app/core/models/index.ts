export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  module_name: string;
  ects: number;
  status: 'open' | 'in_progress' | 'achieved';
  target_date: string;
  created_at: string;
}

export interface PlanSlot {
  id: number;
  goal_id: number;
  year: number;
  month: number;
  day: number | null;
  planned_time: string | null;
  duration_minutes: number;
  note: string | null;
}

export interface StudySession {
  id: number;
  goal_id: number;
  started_at: string;
  paused_at: string | null;
  total_paused_seconds: number;
  ended_at: string | null;
  duration_seconds: number | null;
  status: 'active' | 'paused' | 'completed';
  note: string | null;
}

export interface ActiveSession {
  id: number;
  goal_id: number;
  goal_title: string;
  started_at: string;
  total_paused_seconds: number;
  status: 'active' | 'paused';
}

export interface GoalStats extends Goal {
  total_actual_minutes: number;
  planned_ects_minutes: number;
}

export interface CurrentMonth {
  year: number;
  month: number;
  planned_minutes: number;
  actual_minutes: number;
}

export interface DashboardData {
  current_month: CurrentMonth;
  goals: GoalStats[];
  inactivity_warning: boolean;
  reminder_text: string | null;
  active_session: ActiveSession | null;
}
