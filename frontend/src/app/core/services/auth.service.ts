import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../models';
import { clearToken, readToken, writeToken } from '../token-storage';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  /** Der Ausweis als Signal, damit Vorlagen auf Aenderungen reagieren. */
  private token = signal<string | null>(readToken());

  currentUser = signal<User | null>(null);

  /** Wird von der Navigationsleiste und vom Router-Waechter gelesen. */
  isLoggedIn = computed(() => this.token() !== null);

  constructor() {
    if (this.token()) {
      void this.loadCurrentUser();
    }
  }

  getToken(): string | null {
    return this.token();
  }

  async register(email: string, name: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ access_token: string; user: User }>(`${API}/auth/register`, { email, name, password })
    );
    this.setSession(res.access_token, res.user);
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ access_token: string; user: User }>(`${API}/auth/login`, { email, password })
    );
    this.setSession(res.access_token, res.user);
  }

  logout(): void {
    clearToken();
    this.token.set(null);
    this.currentUser.set(null);
  }

  private setSession(token: string, user: User): void {
    writeToken(token);
    this.token.set(token);
    this.currentUser.set(user);
  }

  /**
   * Laedt beim Start das Konto zum gespeicherten Token nach.
   * Abgemeldet wird nur bei 401/403 - also wenn der Server den Token
   * ausdruecklich ablehnt. Ein Netzwerkfehler darf die Sitzung nicht zerstoeren.
   */
  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<User>(`${API}/auth/me`));
      this.currentUser.set(user);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) {
        this.logout();
      }
    }
  }
}
