import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { GOAL_STATUS_LABELS, GoalStatus } from '../goal.model';
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

  protected readonly statusLabels = GOAL_STATUS_LABELS;
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    module: ['', [Validators.required, Validators.maxLength(100)]],
    target_date: ['', Validators.required],
    status: this.formBuilder.nonNullable.control<GoalStatus>('offen', Validators.required),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);

    this.goalService.create(this.form.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/ziele']);
      },
      error: () => {
        this.serverError.set('Speichern fehlgeschlagen. Läuft das Backend?');
        this.saving.set(false);
      },
    });
  }
}
