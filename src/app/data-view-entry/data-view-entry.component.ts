import { Component, Input } from '@angular/core';

import { TimerDetail, getClassTeamString } from '../timer-detail/timer-detail';

import { AbsoluteMillisecondTimes, TimeSplitTenths,
         getAbsoluteMillisecondTimes, getTimingSplits } from '../timer-conversion.service';

@Component({
    selector: 'data-view-entry',
    templateUrl: './data-view-entry.component.html',
    styleUrls: ['./data-view-entry.component.css'],
    standalone: false
})
export class DataViewEntryComponent {
  // We use a getter and setter here to force recomputation when inputs change.
  @Input()
  get timer(): TimerDetail | null { return this._timer; }
  set timer(timer: TimerDetail) {
    this._timer = timer;
    this._classTeamString = getClassTeamString(timer.class, timer.team);
    this._abs = getAbsoluteMillisecondTimes(timer);
    this._splits = getTimingSplits(this._abs);
  }

  public _classTeamString : string = "";
  public _timer : TimerDetail | null = null;
  public _abs : AbsoluteMillisecondTimes | null = null;
  public _splits : TimeSplitTenths | null = null;
}
