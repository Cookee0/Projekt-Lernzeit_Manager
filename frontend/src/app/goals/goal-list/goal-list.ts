import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { GOAL_STATUS_LABELS, Goal } from '../goal.model';
import { GoalService } from '../goal.service';

@Component({
  selector: 'app-goal-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './goal-list.html',
  styleUrl: './goal-list.scss',
})
export class GoalList {
  private readonly goalService = inject(GoalService);

  protected readonly statusLabels = GOAL_STATUS_LABELS;
  protected readonly goals = signal<Goal[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.goalService.list().subscribe({
      next: (goals) => {
        this.goals.set(goals);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Lernziele konnten nicht geladen werden. Läuft das Backend?');
        this.loading.set(false);
      },
    });
  }
}
