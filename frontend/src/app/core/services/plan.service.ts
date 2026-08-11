import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlanSlot } from '../models';

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

  create(payload: Partial<PlanSlot>): Promise<PlanSlot> {
    return firstValueFrom(this.http.post<PlanSlot>(API, payload));
  }

  update(id: number, payload: Partial<PlanSlot>): Promise<PlanSlot> {
    return firstValueFrom(this.http.put<PlanSlot>(`${API}/${id}`, payload));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/${id}`));
  }
}
