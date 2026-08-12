import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActiveSession, Goal, StudySession } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-timer',
  imports: [FormsModule],
  template: `
    <div class="page">
      <h2>Lernzeit-Timer</h2>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <div class="card timer-card">
        @if (!activeSession()) {
          <div class="timer-setup">
            <div class="form-group">
              <label for="timer-goal">Lernziel auswählen</label>
              <select id="timer-goal" [(ngModel)]="selectedGoalId" name="goal">
                <option [value]="0" disabled>Ziel wählen…</option>
                @for (goal of goals(); track goal.id) {
                  <option [value]="goal.id">{{ goal.title }}</option>
                }
              </select>
            </div>
            <button class="btn btn-primary btn-large" (click)="start()" [disabled]="!selectedGoalId || loading()">
              ▶ Start
            </button>
          </div>
        } @else {
          <div class="timer-running">
            <div class="timer-goal-name">{{ activeSession()!.goal_title }}</div>
            <div class="timer-display" [class.paused]="activeSession()!.status === 'paused'">
              {{ displayTime() }}
            </div>
            <div class="timer-status">
              {{ activeSession()!.status === 'paused' ? '⏸ Pausiert' : '▶ Läuft' }}
            </div>
            <div class="timer-buttons">
              @if (activeSession()!.status === 'active') {
                <button class="btn btn-secondary" (click)="pause()" [disabled]="loading()">⏸ Pause</button>
              } @else {
                <button class="btn btn-primary" (click)="resume()" [disabled]="loading()">▶ Weiter</button>
              }
              <button class="btn btn-danger" (click)="stop()" [disabled]="loading()">⏹ Stopp</button>
            </div>
          </div>
        }
      </div>

      <div class="card">
        <h3>Zuletzt gelernt</h3>
        @if (sessions().length === 0) {
          <p class="empty">Noch keine aufgezeichneten Lernzeiten.</p>
        } @else {
          @for (s of sessions(); track s.id) {
            <div class="session-row">
              <span>{{ goalName(s.goal_id) }}</span>
              <span>{{ formatDuration(s.duration_seconds) }}</span>
              <span class="session-date">{{ formatDate(s.started_at) }}</span>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class TimerComponent implements OnInit, OnDestroy {
  private goalService = inject(GoalService);
  private sessionService = inject(SessionService);

  goals = signal<Goal[]>([]);
  sessions = signal<StudySession[]>([]);
  activeSession = signal<ActiveSession | null>(null);
  displayTime = signal('00:00:00');
  error = signal('');
  loading = signal(false);

  selectedGoalId = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    this.goals.set(await this.goalService.list());
    await this.loadActive();
    await this.loadSessions();
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  private async loadActive(): Promise<void> {
    const session = await this.sessionService.getActive();
    this.activeSession.set(session);
    if (session?.status === 'active') {
      this.startClientTimer(session.started_at, session.total_paused_seconds);
    } else if (session?.status === 'paused') {
      this.displayTime.set('⏸ Pausiert');
    }
  }

  private async loadSessions(): Promise<void> {
    this.sessions.set(await this.sessionService.list({ limit: 10 }));
  }

  private startClientTimer(startedAt: string, alreadyPausedSeconds = 0): void {
    this.clearInterval();
    const serverStart = new Date(startedAt).getTime();
    this.intervalId = setInterval(() => {
      const rawElapsed = Math.floor((Date.now() - serverStart) / 1000);
      const elapsed = Math.max(0, rawElapsed - alreadyPausedSeconds);
      this.displayTime.set(this.secondsToHms(elapsed));
    }, 1000);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async start(): Promise<void> {
    if (!this.selectedGoalId) return;
    this.error.set('');
    this.loading.set(true);
    try {
      const session = await this.sessionService.start(this.selectedGoalId);
      const active: ActiveSession = {
        id: session.id,
        goal_id: session.goal_id,
        goal_title: this.goals().find(g => g.id === session.goal_id)?.title ?? '',
        started_at: session.started_at,
        total_paused_seconds: 0,
        status: 'active',
      };
      this.activeSession.set(active);
      this.startClientTimer(session.started_at);
    } catch (err) {
      const msg = err instanceof HttpErrorResponse ? err.error?.error : undefined;
      this.error.set(msg ?? 'Fehler beim Starten.');
    } finally {
      this.loading.set(false);
    }
  }

  async pause(): Promise<void> {
    const s = this.activeSession();
    if (!s) return;
    this.loading.set(true);
    try {
      await this.sessionService.pause(s.id);
      this.clearInterval();
      this.activeSession.update(a => a ? { ...a, status: 'paused' } : a);
      this.displayTime.set('⏸ Pausiert');
    } finally {
      this.loading.set(false);
    }
  }

  async resume(): Promise<void> {
    const s = this.activeSession();
    if (!s) return;
    this.loading.set(true);
    try {
      const updated = await this.sessionService.resume(s.id);
      this.activeSession.update(a => a ? { ...a, status: 'active', total_paused_seconds: updated.total_paused_seconds } : a);
      this.startClientTimer(updated.started_at, updated.total_paused_seconds);
    } finally {
      this.loading.set(false);
    }
  }

  async stop(): Promise<void> {
    const s = this.activeSession();
    if (!s) return;
    this.loading.set(true);
    try {
      await this.sessionService.stop(s.id);
      this.clearInterval();
      this.activeSession.set(null);
      this.displayTime.set('00:00:00');
      await this.loadSessions();
    } finally {
      this.loading.set(false);
    }
  }

  goalName(id: number): string {
    return this.goals().find(g => g.id === id)?.title ?? `Ziel ${id}`;
  }

  formatDuration(seconds: number | null): string {
    if (seconds === null) return '—';
    return this.secondsToHms(seconds);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE');
  }

  private secondsToHms(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  }
}
