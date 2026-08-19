import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StatsData } from '../models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);

  get(): Promise<StatsData> {
    return firstValueFrom(this.http.get<StatsData>('/api/stats'));
  }
}
