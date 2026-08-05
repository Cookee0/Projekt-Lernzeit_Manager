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

  /** Kennung des Ziels, fuer das gerade nachgefragt wird, oder null. */
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly deleteError = signal<string | null>(null);

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

  /** Blendet die Rueckfrage fuer eine Zeile ein. Loescht noch nichts. */
  protected askDelete(id: number): void {
    this.deleteError.set(null);
    this.pendingDeleteId.set(id);
  }

  /** Verwirft die Rueckfrage, ohne zu loeschen. */
  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  /** Loescht endgueltig und entfernt die Zeile aus der Anzeige. */
  protected confirmDelete(id: number): void {
    this.goalService.remove(id).subscribe({
      next: () => {
        this.goals.update((goals) => goals.filter((goal) => goal.id !== id));
        this.pendingDeleteId.set(null);
      },
      error: () => {
        this.deleteError.set('Löschen fehlgeschlagen. Läuft das Backend?');
        this.pendingDeleteId.set(null);
      },
    });
  }
}
