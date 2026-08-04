import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Goal, NewGoal } from './goal.model';

/**
 * Kapselt alle HTTP-Aufrufe rund um Lernziele.
 *
 * Die Backend-URL steht bewusst nur hier. Wird das Frontend später auf
 * Railway deployt, muss genau diese eine Konstante ersetzt werden.
 */
@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api/goals';

  /** Holt alle Lernziele, vom Backend nach Zieldatum sortiert. */
  list(): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.baseUrl);
  }

  /** Legt ein Lernziel an und liefert das gespeicherte Ziel inklusive id zurück. */
  create(goal: NewGoal): Observable<Goal> {
    return this.http.post<Goal>(this.baseUrl, goal);
  }
}
