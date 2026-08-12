import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Goal } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { validateEcts, validateRequiredText, validateTargetDate } from '../../core/validation';

const MONTHS_AHEAD = 6;

function defaultTargetDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + MONTHS_AHEAD);
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-goals',
  imports: [FormsModule],
  template: `
    <div class="page">
      <h2>Lernziele</h2>

      <div class="card">
        <h3>Neues Lernziel</h3>
        @if (createError()) {
          <div class="alert alert-error">{{ createError() }}</div>
        }
        <form (ngSubmit)="create()" class="goal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="goal-title">Titel</label>
              <input id="goal-title" [(ngModel)]="form.title" name="title"
                (ngModelChange)="clearFieldError('title')"
                [class.input-error]="fieldErrors()['title']" placeholder="z.B. Programmierung 1" />
              @if (fieldErrors()['title']) {
                <p class="field-error">{{ fieldErrors()['title'] }}</p>
              }
            </div>
            <div class="form-group">
              <label for="goal-module">Modul / Kurs</label>
              <input id="goal-module" [(ngModel)]="form.module_name" name="module_name"
                (ngModelChange)="clearFieldError('module_name')"
                [class.input-error]="fieldErrors()['module_name']" placeholder="z.B. DLBIPPR01" />
              @if (fieldErrors()['module_name']) {
                <p class="field-error">{{ fieldErrors()['module_name'] }}</p>
              }
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="goal-ects" title="1 ECTS = ca. 30 Stunden Lernaufwand">ECTS-Punkte des Moduls</label>
              <input id="goal-ects" type="number" [(ngModel)]="form.ects" name="ects" min="1" max="30"
                (ngModelChange)="clearFieldError('ects')"
                [class.input-error]="fieldErrors()['ects']" />
              @if (fieldErrors()['ects']) {
                <p class="field-error">{{ fieldErrors()['ects'] }}</p>
              }
            </div>
            <div class="form-group">
              <label for="goal-target-date">Wann willst du fertig sein?</label>
              <input id="goal-target-date" type="date" [(ngModel)]="form.target_date" name="target_date"
                (ngModelChange)="clearFieldError('target_date')"
                [class.input-error]="fieldErrors()['target_date']" />
              @if (fieldErrors()['target_date']) {
                <p class="field-error">{{ fieldErrors()['target_date'] }}</p>
              }
            </div>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Speichern…' : 'Ziel hinzufügen' }}
          </button>
        </form>
      </div>

      <div class="goals-list">
        @if (loading()) {
          <p class="loading">Lädt…</p>
        } @else if (goals().length === 0) {
          <p class="empty">Noch keine Lernziele. Füge dein erstes Ziel hinzu.</p>
        } @else {
          @for (goal of goals(); track goal.id) {
            <div class="card goal-card" [class.achieved]="goal.status === 'achieved'">
              <div class="goal-header">
                <div>
                  <strong>{{ goal.title }}</strong>
                  <span class="module-tag">{{ goal.module_name }}</span>
                </div>
                <span class="status-badge" [class]="'status-' + goal.status">{{ statusLabel(goal.status) }}</span>
              </div>
              <div class="goal-meta">
                <span>📅 Ziel: {{ formatDate(goal.target_date) }}</span>
                <span title="1 ECTS entspricht ca. 30 Stunden Lernaufwand">🎓 {{ goal.ects }} ECTS ({{ goal.ects * 30 }}h)</span>
              </div>
              <div class="goal-actions">
                @if (goal.status !== 'achieved') {
                  <button class="btn btn-sm btn-success" (click)="markAchieved(goal)">✓ Erreicht</button>
                  @if (goal.status === 'open') {
                    <button class="btn btn-sm btn-secondary" (click)="markInProgress(goal)">▶ In Arbeit</button>
                  }
                }
                <button class="btn btn-sm btn-danger" (click)="remove(goal)">🗑 Löschen</button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class GoalsComponent implements OnInit {
  private goalService = inject(GoalService);

  goals = signal<Goal[]>([]);
  loading = signal(true);
  saving = signal(false);
  createError = signal('');
  fieldErrors = signal<Record<string, string>>({});

  /** Loescht die Fehlermeldung eines Feldes, sobald der Wert geaendert wird. */
  clearFieldError(field: string): void {
    this.fieldErrors.update((errors) => {
      if (!errors[field]) return errors;
      const rest = { ...errors };
      delete rest[field];
      return rest;
    });
  }

  form = {
    title: '',
    module_name: '',
    ects: 5,
    target_date: defaultTargetDate(),
  };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.goals.set(await this.goalService.list());
    } finally {
      this.loading.set(false);
    }
  }

  async create(): Promise<void> {
    this.createError.set('');

    const errors: Record<string, string> = {};
    const titleError = validateRequiredText(this.form.title, 'Titel');
    const moduleError = validateRequiredText(this.form.module_name, 'Modul/Kurs');
    const ectsError = validateEcts(this.form.ects);
    const dateError = validateTargetDate(this.form.target_date);
    if (titleError) errors['title'] = titleError;
    if (moduleError) errors['module_name'] = moduleError;
    if (ectsError) errors['ects'] = ectsError;
    if (dateError) errors['target_date'] = dateError;
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

    this.saving.set(true);
    try {
      const goal = await this.goalService.create({ ...this.form, status: 'open' });
      this.goals.update(gs => [...gs, goal]);
      this.form = { title: '', module_name: '', ects: 5, target_date: defaultTargetDate() };
    } catch (err) {
      const msg = err instanceof HttpErrorResponse ? err.error?.error : undefined;
      this.createError.set(msg ?? 'Fehler beim Speichern.');
    } finally {
      this.saving.set(false);
    }
  }

  async markAchieved(goal: Goal): Promise<void> {
    const updated = await this.goalService.update(goal.id, { status: 'achieved' });
    this.goals.update(gs => gs.map(g => g.id === goal.id ? updated : g));
  }

  async markInProgress(goal: Goal): Promise<void> {
    const updated = await this.goalService.update(goal.id, { status: 'in_progress' });
    this.goals.update(gs => gs.map(g => g.id === goal.id ? updated : g));
  }

  async remove(goal: Goal): Promise<void> {
    if (!confirm(`Lernziel "${goal.title}" wirklich löschen?`)) return;
    await this.goalService.delete(goal.id);
    this.goals.update(gs => gs.filter(g => g.id !== goal.id));
  }

  statusLabel(status: string): string {
    return { open: 'Offen', in_progress: 'In Arbeit', achieved: 'Erreicht' }[status] ?? status;
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
}
