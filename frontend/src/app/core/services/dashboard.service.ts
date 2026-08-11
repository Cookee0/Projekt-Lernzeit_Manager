import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DashboardData } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  get(): Promise<DashboardData> {
    return firstValueFrom(this.http.get<DashboardData>('/api/dashboard'));
  }
}
