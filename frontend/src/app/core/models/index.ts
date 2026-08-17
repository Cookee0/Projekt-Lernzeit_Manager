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
  priority: 'high' | 'medium' | 'low' | null;
  grade: string | null;
  result_note: string | null;
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

/** Grobplanungs-Vorschlag je Lernziel (FR-2.1, FR-2.2, FR-3.3). */
export interface PlanProposalGoal {
  goal_id: number;
  title: string;
  module_name: string;
  weekly_budget_minutes: number;
  suggested_month_minutes: number;
  planned_minutes: number;
  deviation_minutes: number;
}

export interface PlanProposal {
  year: number;
  month: number;
  goals: PlanProposalGoal[];
}

export interface Milestone {
  id: number;
  goal_id: number | null;
  title: string;
  year: number;
  month: number;
  due_day: number | null;
  done: boolean;
  created_at: string;
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
  /** Restaufwand je verbleibender Woche bis zum Zieldatum (FR-2.1). */
  weekly_budget_minutes: number;
}

export interface CurrentMonth {
  year: number;
  month: number;
  planned_minutes: number;
  actual_minutes: number;
  /** Pausenzeit des Monats (FR-4.3); actual_minutes zaehlt Pausen nie mit. */
  paused_minutes: number;
}

/** Lernzeit einer Kalenderwoche fuer die Trendauswertung (FR-6.3). */
export interface WeekPoint {
  week_start: string;
  minutes: number;
}

/** Warnung bei nahendem Zieltermin ohne Fortschritt (FR-7.3). */
export interface DeadlineWarning {
  goal_id: number;
  title: string;
  target_date: string;
  days_left: number;
  progress_pct: number;
}

export interface DashboardData {
  current_month: CurrentMonth;
  goals: GoalStats[];
  weekly_history: WeekPoint[];
  deadline_warnings: DeadlineWarning[];
  milestones: { done: number; total: number };
  inactivity_warning: boolean;
  reminder_text: string | null;
  active_session: ActiveSession | null;
}
