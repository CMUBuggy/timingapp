import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ExtendedTimerDetail, TimerDetail } from './timer-detail';

@Component({
  selector: 'timer-detail',
  templateUrl: './timer-detail.component.html',
  styleUrls: ['./timer-detail.component.css']
})
export class TimerDetailComponent implements OnChanges {
  // Can't click because my location is invalid or buggy past my location
  clickInvalid : boolean = true;
  // Can't click because buggy unstarted and I am not a start location.
  // Always false if clickInvalid == true.
  clickTooEarly : boolean = false;
  // Clicking will start the roll (valid at Start & Crosswalk when roll unstarted)
  // Always false if clickInvalid == true.
  clickToStart : boolean = false;
  // Clikcing will enter a new time (valid when buggy has not passed current location and roll started)
  // Always false if clickInvalid == true.
  clickToTime : boolean = false;

  @Input() timer: ExtendedTimerDetail | null = null;
  @Input() myLocation: number = -1;
  @Output() timeevent = new EventEmitter<TimerDetail>();
  @Output() scratch = new EventEmitter<TimerDetail>();

  ngOnChanges(changes: SimpleChanges): void {
    this.clickInvalid =
      this.timer == null ||
        (this.myLocation < 0 ||
          (this.timer.lastSeenAt != null && this.myLocation <= this.timer.lastSeenAt))

    if ( !this.clickInvalid ) {
      this.clickTooEarly =
        this.timer != null &&
        (this.timer.lastSeenAt == null || this.timer.lastSeenAt < 0) &&
        !([0, 2].includes(this.myLocation));
      this.clickToTime =
        this.timer != null &&
        (this.timer.lastSeenAt != null && this.timer.lastSeenAt >= 0) &&
        (this.myLocation != 0);
      this.clickToStart =
        this.timer != null &&
        (this.timer.lastSeenAt == null || this.timer.lastSeenAt < 0) &&
        ([0, 2].includes(this.myLocation));
    } else {
      this.clickTooEarly = false;
      this.clickToTime = false;
      this.clickToStart = false;
    }
  }
}
