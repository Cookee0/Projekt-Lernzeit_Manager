import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActiveSession, StudySession } from '../models';

const API = '/api/sessions';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);

  list(filters: { goal_id?: number; limit?: number } = {}): Promise<StudySession[]> {
    let params = new HttpParams();
    if (filters.goal_id) params = params.set('goal_id', filters.goal_id);
    if (filters.limit) params = params.set('limit', filters.limit);
    return firstValueFrom(this.http.get<StudySession[]>(API, { params }));
  }

  getActive(): Promise<ActiveSession | null> {
    return firstValueFrom(
      this.http.get<ActiveSession>(`${API}/active`, { observe: 'response' })
    ).then(res => (res.status === 204 ? null : res.body));
  }

  start(goal_id: number): Promise<StudySession> {
    return firstValueFrom(this.http.post<StudySession>(`${API}/start`, { goal_id }));
  }

  pause(id: number): Promise<StudySession> {
    return firstValueFrom(this.http.post<StudySession>(`${API}/${id}/pause`, {}));
  }

  resume(id: number): Promise<StudySession> {
    return firstValueFrom(this.http.post<StudySession>(`${API}/${id}/resume`, {}));
  }

  stop(id: number, note?: string): Promise<StudySession> {
    return firstValueFrom(this.http.post<StudySession>(`${API}/${id}/stop`, { note: note ?? null }));
  }
}
