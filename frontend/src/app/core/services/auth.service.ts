import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../models';

const API = '/api';
const TOKEN_KEY = 'lm_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  constructor() {
    const token = this.getToken();
    if (token) {
      this.loadCurrentUser().catch(() => this.logout());
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async register(email: string, name: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ access_token: string; user: User }>(`${API}/auth/register`, { email, name, password })
    );
    localStorage.setItem(TOKEN_KEY, res.access_token);
    this.currentUser.set(res.user);
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ access_token: string; user: User }>(`${API}/auth/login`, { email, password })
    );
    localStorage.setItem(TOKEN_KEY, res.access_token);
    this.currentUser.set(res.user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
  }

  private async loadCurrentUser(): Promise<void> {
    const user = await firstValueFrom(this.http.get<User>(`${API}/auth/me`));
    this.currentUser.set(user);
  }
}
