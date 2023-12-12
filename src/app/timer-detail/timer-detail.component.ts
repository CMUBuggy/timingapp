import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ExtendedTimerDetail, TimerDetail, getClassTeamString } from './timer-detail';

const SCRATCH_TEXT: string = "Scratch";
const END_ROLL_TEXT: string = "DNF";

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

  // True if we are the most recent time update, and thus we can undo that time.
  canUndo : boolean = false;

  // Label for the "Scratch"/"End Roll" button
  scratchLabel : string = SCRATCH_TEXT;

  // The full expansion of the class & team (e.g. "Women's C")
  classTeam : string = "";

  @Input() timer: ExtendedTimerDetail | null = null;
  @Input() myLocation: number = -1;
  @Output() timeevent = new EventEmitter<TimerDetail>();
  @Output() scratch = new EventEmitter<TimerDetail>();
  @Output() undo = new EventEmitter<TimerDetail>();

  markTime() {
    if (this.timer == null || this.clickInvalid || this.clickTooEarly) {
      // Can't click yet (and appearance should so indicate)
      return;
    }
    this.timeevent.emit(this.timer.db);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.classTeam = getClassTeamString(this.timer?.db.class, this.timer?.db.team);

    const unstartedRoll = this.timer == null || this.timer.lastSeenAt == null || this.timer.lastSeenAt < 0;

    // To undo, there must be a timer that actually has a time,
    // and the most recent time must be at our location.
    //
    // TODO: Because it completes the roll, the finish line implicitly cannot perform an undo.
    this.canUndo = this.timer != null && this.timer.lastSeenAt != null && this.myLocation != -1 &&
                   this.timer.lastSeenAt == this.myLocation;

    if (unstartedRoll) {
      this.scratchLabel = SCRATCH_TEXT;
    } else {
      this.scratchLabel = END_ROLL_TEXT;
    }

    this.clickInvalid =
      this.timer == null ||
        (this.myLocation < 0 ||
          (this.timer.lastSeenAt != null && this.myLocation <= this.timer.lastSeenAt))

    if ( !this.clickInvalid ) {
      this.clickTooEarly = unstartedRoll && !([0, 2].includes(this.myLocation));
      this.clickToTime = !unstartedRoll && this.myLocation != 0;
      this.clickToStart = unstartedRoll && ([0, 2].includes(this.myLocation));
    } else {
      this.clickTooEarly = false;
      this.clickToTime = false;
      this.clickToStart = false;
    }
  }
}
