import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Milestone } from '../models';

const API = '/api/milestones';

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private http = inject(HttpClient);

  list(filters: { goal_id?: number; year?: number; month?: number } = {}): Promise<Milestone[]> {
    let params = new HttpParams();
    if (filters.goal_id) params = params.set('goal_id', filters.goal_id);
    if (filters.year) params = params.set('year', filters.year);
    if (filters.month) params = params.set('month', filters.month);
    return firstValueFrom(this.http.get<Milestone[]>(API, { params }));
  }

  create(payload: Partial<Milestone>): Promise<Milestone> {
    return firstValueFrom(this.http.post<Milestone>(API, payload));
  }

  update(id: number, payload: Partial<Milestone>): Promise<Milestone> {
    return firstValueFrom(this.http.put<Milestone>(`${API}/${id}`, payload));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/${id}`));
  }
}
