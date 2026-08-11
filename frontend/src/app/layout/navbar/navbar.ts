import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
        </ul>
        <div class="navbar-user">
          <span>{{ auth.currentUser()?.name }}</span>
          <button class="btn btn-sm btn-secondary" (click)="logout()">Abmelden</button>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
