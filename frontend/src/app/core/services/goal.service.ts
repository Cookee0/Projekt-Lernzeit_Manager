import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Goal } from '../models';

const API = '/api/goals';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private http = inject(HttpClient);

  list(): Promise<Goal[]> {
    return firstValueFrom(this.http.get<Goal[]>(API));
  }

  get(id: number): Promise<Goal> {
    return firstValueFrom(this.http.get<Goal>(`${API}/${id}`));
  }

  create(payload: Partial<Goal>): Promise<Goal> {
    return firstValueFrom(this.http.post<Goal>(API, payload));
  }

  update(id: number, payload: Partial<Goal>): Promise<Goal> {
    return firstValueFrom(this.http.put<Goal>(`${API}/${id}`, payload));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/${id}`));
  }
}
