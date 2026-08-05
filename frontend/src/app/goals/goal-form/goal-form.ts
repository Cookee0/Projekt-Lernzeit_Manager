import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  GOAL_PRIORITY_LABELS,
  GOAL_STATUS_LABELS,
  GoalPriority,
  GoalStatus,
  NewGoal,
} from '../goal.model';
import { GoalService } from '../goal.service';

@Component({
  selector: 'app-goal-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './goal-form.html',
  styleUrl: './goal-form.scss',
})
export class GoalForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly goalService = inject(GoalService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Kennung des zu bearbeitenden Ziels, oder null beim Anlegen. */
  protected readonly goalId = this.leseGoalIdAusRoute();
  protected readonly isEdit = this.goalId !== null;

  protected readonly statusLabels = GOAL_STATUS_LABELS;
  protected readonly priorityLabels = GOAL_PRIORITY_LABELS;
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    module: ['', [Validators.required, Validators.maxLength(100)]],
    target_date: ['', Validators.required],
    status: this.formBuilder.nonNullable.control<GoalStatus>('offen', Validators.required),
    // '' steht fuer "keine Prioritaet". Die Auswahlliste kann kein null liefern.
    priority: this.formBuilder.nonNullable.control<GoalPriority | ''>(''),
  });

  constructor() {
    if (this.goalId === null) {
      return;
    }

    this.loading.set(true);
    this.goalService.get(this.goalId).subscribe({
      next: (goal) => {
        this.form.setValue({
          title: goal.title,
          module: goal.module,
          target_date: goal.target_date,
          status: goal.status,
          priority: goal.priority ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.serverError.set('Das Lernziel konnte nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);

    const formular = this.form.getRawValue();
    const werte: NewGoal = {
      ...formular,
      // Die Auswahlliste liefert '' fuer "keine Prioritaet", die API erwartet null.
      priority: formular.priority === '' ? null : formular.priority,
    };
    const anfrage =
      this.goalId === null
        ? this.goalService.create(werte)
        : this.goalService.update(this.goalId, werte);

    anfrage.subscribe({
      next: () => {
        void this.router.navigate(['/ziele']);
      },
      error: () => {
        this.serverError.set('Speichern fehlgeschlagen. Läuft das Backend?');
        this.saving.set(false);
      },
    });
  }

  /** Liest die Kennung aus der Adresse. Gibt null zurueck, wenn keine vorhanden ist. */
  private leseGoalIdAusRoute(): number | null {
    const rohwert = this.route.snapshot.paramMap.get('id');
    if (rohwert === null) {
      return null;
    }

    const id = Number(rohwert);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
