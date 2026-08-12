import { Component, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { validateEmail, validatePassword, validateRequiredText } from '../../../core/validation';

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
            <input id="name" type="text" [(ngModel)]="name" name="name"
              (ngModelChange)="clearFieldError('name')"
              [class.input-error]="fieldErrors()['name']" placeholder="Dein Name" />
            @if (fieldErrors()['name']) {
              <p class="field-error">{{ fieldErrors()['name'] }}</p>
            }
          </div>
          <div class="form-group">
            <label for="email">E-Mail</label>
            <input id="email" type="email" [(ngModel)]="email" name="email"
              (ngModelChange)="clearFieldError('email')"
              [class.input-error]="fieldErrors()['email']" placeholder="name@beispiel.de" />
            @if (fieldErrors()['email']) {
              <p class="field-error">{{ fieldErrors()['email'] }}</p>
            }
          </div>
          <div class="form-group">
            <label for="password">Passwort</label>
            <input id="password" type="password" [(ngModel)]="password" name="password"
              (ngModelChange)="clearFieldError('password')"
              [class.input-error]="fieldErrors()['password']" placeholder="Mindestens 6 Zeichen" />
            @if (fieldErrors()['password']) {
              <p class="field-error">{{ fieldErrors()['password'] }}</p>
            }
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
  fieldErrors = signal<Record<string, string>>({});

  /** Loescht die Fehlermeldung eines Feldes, sobald der Wert geaendert wird. */
  clearFieldError(field: string): void {
    this.fieldErrors.update((errors) => {
      if (!errors[field]) return errors;
      const rest = { ...errors };
      delete rest[field];
      return rest;
    });
  }

  async submit(): Promise<void> {
    this.error.set('');

    const errors: Record<string, string> = {};
    const nameError = validateRequiredText(this.name, 'Name');
    const emailError = validateEmail(this.email);
    const passwordError = validatePassword(this.password);
    if (nameError) errors['name'] = nameError;
    if (emailError) errors['email'] = emailError;
    if (passwordError) errors['password'] = passwordError;
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

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
