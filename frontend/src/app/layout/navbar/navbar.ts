import { Component, ElementRef, HostListener, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ReminderService } from '../../core/services/reminder.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="brand-link">📚 Lernzeit-Manager</a>
      </div>
      @if (auth.isLoggedIn()) {
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Dashboard</a></li>
          <li><a routerLink="/goals" routerLinkActive="active">Lernziele</a></li>
          <li><a routerLink="/planning" routerLinkActive="active">Planung</a></li>
          <li><a routerLink="/timer" routerLinkActive="active">Timer</a></li>
          <li><a routerLink="/calendar" routerLinkActive="active">Kalender</a></li>
          <li><a routerLink="/stats" routerLinkActive="active">Auswertung</a></li>
        </ul>
        <div class="navbar-user">
          <div class="reminder-bell-wrap">
            <button
              type="button"
              class="reminder-bell"
              aria-label="Erinnerungen"
              (click)="toggleReminders()"
            >
              🔔
              @if (reminderService.reminders().length > 0) {
                <span class="reminder-badge">{{ reminderService.reminders().length }}</span>
              }
            </button>
            @if (remindersOpen()) {
              <div class="reminder-dropdown">
                @if (reminderService.reminders().length === 0) {
                  <p class="reminder-empty">Keine Erinnerungen — alles im Plan.</p>
                } @else {
                  @for (reminder of reminderService.reminders(); track $index) {
                    <a
                      [routerLink]="reminder.link"
                      class="reminder-item"
                      (click)="remindersOpen.set(false)"
                    >
                      <span>{{ reminder.icon }}</span> {{ reminder.text }}
                    </a>
                  }
                }
              </div>
            }
          </div>
          <span>{{ auth.currentUser()?.name }}</span>
          <button class="btn btn-sm btn-secondary" (click)="logout()">Abmelden</button>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  protected reminderService = inject(ReminderService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  remindersOpen = signal(false);

  constructor() {
    // Laedt die Erinnerungen einmal neu, sobald der Nutzer eingeloggt ist
    // (auch direkt nach einem Seiten-Reload mit gueltigem Token).
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.refreshReminders();
      } else {
        this.reminderService.clear();
      }
    });

    // Schliesst das Dropdown, sobald zwischen den Reitern gewechselt wird -
    // sonst bliebe es beim Navigieren ueber die Navbar-Links sichtbar.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.remindersOpen.set(false));
  }

  // Schliesst das Dropdown, wenn ausserhalb der Glocke/des Dropdowns geklickt
  // wird (z. B. zurueck ins Hauptfeld).
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.remindersOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.remindersOpen.set(false);
    }
  }

  toggleReminders(): void {
    this.remindersOpen.update((open) => !open);
    if (this.remindersOpen()) {
      this.refreshReminders();
    }
  }

  /** Aktualisiert die Erinnerungen im Hintergrund; ein Fehler bleibt lokal
   *  (kein unbehandelter Promise-Reject), verwirft aber nichts Sichtbares. */
  private refreshReminders(): void {
    void this.reminderService.refresh().catch((err: unknown) => {
      console.error('Erinnerungen konnten nicht geladen werden.', err);
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
