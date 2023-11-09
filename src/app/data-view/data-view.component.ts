import { Component } from '@angular/core';

import { FormControl } from '@angular/forms';

import { TimerDetail } from '../timer-detail/timer-detail';

import { Observable, take } from 'rxjs';

import { TimerDataService } from '../timer-data.service'
import { TimerConversionService } from '../timer-conversion.service';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent {
  displayDate = new FormControl(new Date());
  timers$ = this.getCurrentTimerObservable();

  constructor(private timerDataService: TimerDataService,
              private fileSaver : TimerConversionService) { };

  getCsv() : void {
    // CONSIDER: We go back to the getter here, which is more
    // pure, but if we just force timers$ to be a behaviorsubject
    // instead of a BehaviorSubject masquerading as an
    // Observable.
    let rawTimers = this.getCurrentTimerObservable();

    // The take(1) will complete the observable after the
    // first emit (hopefully basically immediately), so we
    // probably don't need to track the subscription.
    rawTimers.pipe(take(1)).subscribe((value) => {
      // console.log(JSON.stringify(value));
      this.fileSaver.csvDownloadTimers(value);
    });
  }

  dateChange() {
    this.timers$ = this.timerDataService.getDataViewTimers(this.displayDate.value as Date);
  }

  private getCurrentTimerObservable() : Observable<TimerDetail[]> {
    return this.timerDataService.getDataViewTimers(
      this.displayDate.value as Date);
  }
}
