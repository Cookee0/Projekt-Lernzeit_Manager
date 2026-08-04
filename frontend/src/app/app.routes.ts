import { Routes } from '@angular/router';

import { GoalForm } from './goals/goal-form/goal-form';
import { GoalList } from './goals/goal-list/goal-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ziele' },
  { path: 'ziele', component: GoalList },
  { path: 'ziele/neu', component: GoalForm },
];
