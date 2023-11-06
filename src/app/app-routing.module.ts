import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TimerComponent } from './timer/timer.component';
import { BuggyConfigComponent } from './buggy-config/buggy-config.component';
import { DataViewComponent } from './data-view/data-view.component';

const routes: Routes = [
  { path: '', redirectTo: '/timer', pathMatch: 'full' },
  { path: 'timer', component: TimerComponent },
  { path: 'buggyconfig', component: BuggyConfigComponent },
  { path: 'dataview', component: DataViewComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
