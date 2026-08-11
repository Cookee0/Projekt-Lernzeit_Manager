import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <router-outlet />
  `,
})
export class App {}
