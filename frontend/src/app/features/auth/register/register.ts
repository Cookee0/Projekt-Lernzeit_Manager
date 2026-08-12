import { Component, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Lernzeit-Manager</h1>
        <h2>Registrieren</h2>
        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label for="name">Name</label>
            <input id="name" type="text" [(ngModel)]="name" name="name" required placeholder="Dein Name" />
          </div>
          <div class="form-group">
            <label for="email">E-Mail</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required placeholder="name@beispiel.de" />
          </div>
          <div class="form-group">
            <label for="password">Passwort</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required
              placeholder="Mindestens 6 Zeichen" minlength="6" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            {{ loading() ? 'Registrieren…' : 'Konto erstellen' }}
          </button>
        </form>
        <p class="auth-link">Bereits registriert? <a routerLink="/login">Anmelden</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.register(this.email, this.name, this.password);
      this.router.navigate(['/']);
    } catch (err) {
      const msg =
        err instanceof HttpErrorResponse
          ? (err.error?.error ?? 'Registrierung fehlgeschlagen.')
          : 'Registrierung fehlgeschlagen.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
