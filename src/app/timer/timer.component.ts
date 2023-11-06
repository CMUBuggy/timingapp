import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { BuggyPickerComponent, BuggyPickerResult } from '../buggy-picker/buggy-picker.component';

import { TimerDetail } from '../timer-detail/timer-detail';

// For faking data, roughly 8:20am 11/6/23
const recentStamp = 1699277096;

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent {
  // What a mess.  MatButtonToggle "functions as a checkbox" but isn't a boolean.  WTF.
  // So, if it is "true" then we show all the unfinished.  Otherwise we don't.  (empty string?)
  showAllUnfinished: string = "";
  
  timers: TimerDetail[] = [
      // full roll only missing stopsign and chute
      { date: "2023-11-06",
        buggy: { name: "Rage", org: "SDC", smugmugSlug: "i-cdD3Qrq", active: true },
        absoluteTimes: [recentStamp, recentStamp + 10, recentStamp + 15, undefined,
                        undefined, recentStamp + 100, recentStamp + 115, recentStamp + 125,
                        recentStamp + 130 ] },

      // just started at crosswalk
      { date: "2023-11-06",
        buggy: { name: "Conquest", org: "CIA", smugmugSlug: "i-dPKQMJF", active: false },
        absoluteTimes: [undefined, undefined, recentStamp + 120, undefined,
                        undefined, undefined, undefined, undefined, undefined ] },

      // literally nothing yet.
      { date: "2023-11-06",
        buggy: { name: "Rage", org: "SDC", smugmugSlug: "i-cdD3Qrq", active: true },
        absoluteTimes: [undefined, undefined, undefined, undefined,
                        undefined, undefined, undefined, undefined, undefined ]  },
  ];
  
  constructor(private dialog: MatDialog) {}

  addRoll() : void {
    // Open dialog to pick from available buggies to start a roll with
    // Start roll with current date, selected buggy, and blanked out aboslute times.
    const dialogRef = this.dialog.open(BuggyPickerComponent, {
      width: '270px',
      data: {
        buggy: { active: true },
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: BuggyPickerResult|undefined) => {
        if (!result) {
          return;
        }
        let newTimer = {
          date: "2023-11-06", // TODO
          buggy: { ...result.buggy },
          absoluteTimes: Array(9).fill(undefined)
        }

        this.timers.push(newTimer);
      });
  }
}
