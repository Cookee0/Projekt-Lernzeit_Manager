import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Lernzeit-Manager</h1>
        <h2>Anmelden</h2>
        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label for="email">E-Mail</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required placeholder="name@beispiel.de" />
          </div>
          <div class="form-group">
            <label for="password">Passwort</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required placeholder="Passwort" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            {{ loading() ? 'Anmelden…' : 'Anmelden' }}
          </button>
        </form>
        <p class="auth-link">Noch kein Konto? <a routerLink="/register">Registrieren</a></p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch {
      this.error.set('Ungültige E-Mail oder Passwort.');
    } finally {
      this.loading.set(false);
    }
  }
}
