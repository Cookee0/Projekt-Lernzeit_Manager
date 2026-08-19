import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlanProposal, PlanSlot } from '../models';

const API = '/api/plans';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);

  list(filters: { goal_id?: number; year?: number; month?: number } = {}): Promise<PlanSlot[]> {
    let params = new HttpParams();
    if (filters.goal_id) params = params.set('goal_id', filters.goal_id);
    if (filters.year) params = params.set('year', filters.year);
    if (filters.month) params = params.set('month', filters.month);
    return firstValueFrom(this.http.get<PlanSlot[]>(API, { params }));
  }

  /** Grobplanungs-Vorschlag fuer einen Monat; ohne Angabe gilt der laufende Monat. */
  proposal(year?: number, month?: number): Promise<PlanProposal> {
    let params = new HttpParams();
    if (year && month) params = params.set('year', year).set('month', month);
    return firstValueFrom(this.http.get<PlanProposal>(`${API}/proposal`, { params }));
  }

  create(payload: Partial<PlanSlot>): Promise<PlanSlot> {
    return firstValueFrom(this.http.post<PlanSlot>(API, payload));
  }

  /** Legt fuer mehrere Tage eines Monats je einen Slot in einer Transaktion an (FR-3.1). */
  createSeries(payload: {
    goal_id: number;
    year: number;
    month: number;
    days: number[];
    planned_time?: string;
    duration_minutes: number;
    note?: string;
  }): Promise<PlanSlot[]> {
    return firstValueFrom(this.http.post<PlanSlot[]>(`${API}/series`, payload));
  }

  update(id: number, payload: Partial<PlanSlot>): Promise<PlanSlot> {
    return firstValueFrom(this.http.put<PlanSlot>(`${API}/${id}`, payload));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/${id}`));
  }
}
