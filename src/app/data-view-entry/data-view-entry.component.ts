import { Component, Input } from '@angular/core';

import { Timestamp } from '@angular/fire/firestore';
import { TimerDetail } from '../timer-detail/timer-detail';

// TODO: Milliseconds
// Used for converting from firebase Timestamp objects.
interface AbsoluteSecondTimes {
  T0: number | null; // Start
  T1: number | null; // 1-2 Trans
  T2: number | null; // Crosswalk
  T3: number | null; // Stop Sign
  T4: number | null; // Chute Flag
  T5: number | null; // Hill 3 Line
  T6: number | null; // 3-4 Trans
  T7: number | null; // 4-5 Trans
  T8: number | null; // Finish
}

interface TimeSplits {
  hill1: number | null;         // T1 - T0
  hill2: number | null;         // T2 - T1
  fronthills: number | null;    // T2 - T0
  freeroll: number | null;      // T5 - T2
  hill3: number | null;         // T6 - T5
  hill4: number | null;         // T7 - T6
  hill5: number | null;         // T8 - T7
  backhills: number | null;     // T8 - T5
  crosswalkFull: number | null; // T8 - T2
  full: number | null;          // T8 - T0
}

// TODO!!!  Basically all this logic to compute times and splits probably should be factored
// out somewhere else, since we'll need it for CSV generation too, not just this.

@Component({
  selector: 'data-view-entry',
  templateUrl: './data-view-entry.component.html',
  styleUrls: ['./data-view-entry.component.css']
})
export class DataViewEntryComponent {
  @Input()
  get timer(): TimerDetail | null { return this._timer; }
  set timer(timer: TimerDetail) {
    this._timer = timer;
    let a = timer.absoluteTimes;
    if (a == null) {
      this._abs = { T0: null, T1: null, T2: null, T3: null,
                    T4: null, T5: null, T6: null, T7: null, T8: null }
    } else {
      this._abs = {
        T0: (a.T0 != null) ? this.convertTime(a.T0) : null,
        T1: (a.T1 != null) ? this.convertTime(a.T1) : null,
        T2: (a.T2 != null) ? this.convertTime(a.T2) : null,
        T3: (a.T3 != null) ? this.convertTime(a.T3) : null,
        T4: (a.T4 != null) ? this.convertTime(a.T4) : null,
        T5: (a.T5 != null) ? this.convertTime(a.T5) : null,
        T6: (a.T6 != null) ? this.convertTime(a.T6) : null,
        T7: (a.T7 != null) ? this.convertTime(a.T7) : null,
        T8: (a.T8 != null) ? this.convertTime(a.T8) : null
      }
    }

    this._splits = { hill1: null, hill2: null, hill3: null, hill4: null, hill5: null,
                     fronthills: null, freeroll: null, backhills: null,
                     crosswalkFull: null, full: null };

    if (this._abs.T1 && this._abs.T0) {
      this._splits.hill1 = this.roundSplit(this._abs.T1 - this._abs.T0);
    }
    if (this._abs.T2 && this._abs.T1) {
      this._splits.hill2 = this.roundSplit(this._abs.T2 - this._abs.T1);
    }

    if (this._abs.T2 && this._abs.T0) {
      this._splits.fronthills = this.roundSplit(this._abs.T2 - this._abs.T0);
    }

    if (this._abs.T5 && this._abs.T2) {
      this._splits.freeroll = this.roundSplit(this._abs.T5 - this._abs.T2);
    }

    if (this._abs.T6 && this._abs.T5) {
      this._splits.hill3 = this.roundSplit(this._abs.T6 - this._abs.T5);
    }
    if (this._abs.T7 && this._abs.T6) {
      this._splits.hill4 = this.roundSplit(this._abs.T7 - this._abs.T6);
    }
    if (this._abs.T8 && this._abs.T7) {
      this._splits.hill5 = this.roundSplit(this._abs.T8 - this._abs.T7);
    }

    if (this._abs.T8 && this._abs.T5) {
      this._splits.backhills = this.roundSplit(this._abs.T8 - this._abs.T5);
    }

    if (this._abs.T8 && this._abs.T2) {
      this._splits.crosswalkFull = this.roundSplit(this._abs.T8 - this._abs.T2);
    }
    if (this._abs.T8 && this._abs.T0) {
      this._splits.full = this.roundSplit(this._abs.T8 - this._abs.T0);
    }
  }

  // Converts milliseconds to seconds rounded to tenths
  private roundSplit(t: number) : number {
    return Number((t/1000).toFixed(1));
  }

  // Converts a firestore Timestamp to raw milliseconds
  private convertTime(t : Timestamp) : number {
    return t.seconds * 1000 + (t.nanoseconds / 1000000);
  }

  public _timer : TimerDetail | null = null;
  public _abs : AbsoluteSecondTimes | null = null;
  public _splits : TimeSplits | null = null;
  //@Input() timer: TimerDetail | null = null;
}
