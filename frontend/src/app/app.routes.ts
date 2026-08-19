import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'goals',
    canActivate: [authGuard],
    loadComponent: () => import('./features/goals/goals').then(m => m.GoalsComponent),
  },
  {
    path: 'planning',
    canActivate: [authGuard],
    loadComponent: () => import('./features/planning/planning').then(m => m.PlanningComponent),
  },
  {
    path: 'timer',
    canActivate: [authGuard],
    loadComponent: () => import('./features/timer/timer').then(m => m.TimerComponent),
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () => import('./features/calendar/calendar').then(m => m.CalendarComponent),
  },
  {
    path: 'stats',
    canActivate: [authGuard],
    loadComponent: () => import('./features/stats/stats').then(m => m.StatsComponent),
  },
  { path: '**', redirectTo: '/' },
];
