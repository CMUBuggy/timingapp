import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Firestore, doc,
         addDoc, runTransaction,
         serverTimestamp } from '@angular/fire/firestore';

import { Observable, map } from 'rxjs';

import { BuggyPickerComponent, BuggyPickerResult } from '../buggy-picker/buggy-picker.component';
import { ClassPickerComponent, ClassPickerResult } from '../class-picker/class-picker.component';

import { TIMING_SITE_NAMES, CourseTimes, TimerDetail, ExtendedTimerDetail } from '../timer-detail/timer-detail';

import { TimerDataService } from '../timer-data.service';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent {
  // What a mess.  MatButtonToggle "functions as a checkbox" but isn't a boolean.  WTF.
  // So, if it is "true" then we show all the unfinished.  I guess if this is empty it is false?
  showAllFilters: string[] = ["unready"];
  hideUnready: boolean = false;
  showPastMe: boolean = false;

  courseLocation: string = "";
  courseLocationNumeric: number = -1;
  buggyPickerDefaultOrg: string = "";

  // We always grab all pending rolls.  The UI will filter based on current location and
  // the showAllUnfinished setting.  This means fewer DB reads.
  timers$ : Observable<ExtendedTimerDetail[]>;

  constructor(private dialog: MatDialog,
              private datePipe: DatePipe,
              private store: Firestore,
              private messageService: MessageService,
              private timerDataService: TimerDataService) {
    this.timers$ = this.timerDataService.getPendingTimers();

    // Ensure correct state
    this.changeLocation();
    this.changeFilters();
  }

  // Update the location tag based on the drop down.
  changeLocation(): void {
    const VALID_LOCATION_TAGS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
    const locationTag = this.courseLocation.charAt(0);
    if (!VALID_LOCATION_TAGS.includes(locationTag)) {
      this.courseLocationNumeric = -1;
    } else {
      this.courseLocationNumeric = Number(locationTag);
    }
  }

  changeFilters(): void {
    this.hideUnready = !this.showAllFilters.includes("unready");
    this.showPastMe = this.showAllFilters.includes("pastme");
  }

  // This is a bit ugly because it chains two dialog boxes.
  addRoll() : void {
    // Open dialog to pick from available buggies to start a roll with
    // Start roll with current date, selected buggy, and blanked out aboslute times.
    const buggyDialogRef = this.dialog.open(BuggyPickerComponent, {
      width: '280px',
      data: {
        defaultOrg: this.buggyPickerDefaultOrg
      },
    });
    buggyDialogRef
      .afterClosed()
      .subscribe((result: BuggyPickerResult|undefined) => {
        if (!result) {
          return;
        }

        const classDialogRef = this.dialog.open(ClassPickerComponent, {
          width: '280px',
          data: {}
        });
        classDialogRef.afterClosed().subscribe(
          (classResult: ClassPickerResult|undefined) => {

          if (!classResult) {
            // Canceled
            return;
          }

          if (classResult.confirmed &&
              (!["A","M","W"].includes(classResult.class) ||
               !["A","B","C","D"].includes(classResult.team))) {
              this.messageService.add("Bad Data From Class Picker: [c:"
                                      + classResult.class + "] [t:"
                                      + classResult.team +"]");
              return;
          }

          let today = this.datePipe.transform(new Date(),"yyyy-MM-dd");
          if (!today) {
            this.messageService.add("Cannot determine current date");
            return;
          }

          // Input was all good, store the default org.
          this.buggyPickerDefaultOrg = result.nextDefaultOrg;

          let newTimer : TimerDetail = {
            date: today,
            creationTime: serverTimestamp(),
            completed: false,
            buggy: { ...result.buggy },
            absoluteTimes: { T0: null, T1: null, T2: null, T3: null,
                             T4: null, T5: null, T6: null, T7: null, T8: null }
          }

          if (classResult.confirmed) {
            newTimer.class = classResult.class
            newTimer.team = classResult.team
          }

          addDoc(this.timerDataService.getTimerCollection(), newTimer)
            .catch(error => {
              this.messageService.add("New Roll Creation error: " + error);
            });
        });
      });
  }

  async markTime(timer: TimerDetail) {
    // This first error is really the only one we can safely detect outside the
    // transaction context, since it indicates our local state isn't properly
    // configured.
    if (this.courseLocationNumeric < 0 || this.courseLocationNumeric > 8) {
      this.messageService.add("Not logging time, invalid location id: " + this.courseLocationNumeric);
      return;
    }

    const docRef = doc(this.timerDataService.getTimerCollection(),
                       timer.id);
    const updateKey = "absoluteTimes.T" + this.courseLocationNumeric;
    const txnCourseLocation = this.courseLocationNumeric;
    console.log("Marking time for: " + timer.id + " at '" +
                TIMING_SITE_NAMES[txnCourseLocation] + "' via " + updateKey);

    try {
      await runTransaction(this.store, async(txn) => {
        const snap = await txn.get(docRef);
        if (!snap.exists()) {
          throw "Timer" + timer.id + "doesn't exist?";
        }

        const t = snap.data() as TimerDetail;
        if (t.completed) {
          return Promise.reject("Roll " + t.id + " Already Completed")
        }

        const et = new ExtendedTimerDetail(t);
        if (et.lastSeenAt != null && et.lastSeenAt >= txnCourseLocation) {
          return Promise.reject("Roll " + timer.id + " has data at " +
                                et.lastSeenAtString +
                                " therefore update failed here at " +
                                TIMING_SITE_NAMES[txnCourseLocation]);
        }

        if (et.lastSeenAt == -1 && !([0, 2].includes(txnCourseLocation))) {
          return Promise.reject("Roll " + timer.id + " not yet started and " +
                                TIMING_SITE_NAMES[txnCourseLocation] +
                                " is not a start location.")
        }

        let myUpdate : any = { [updateKey]: serverTimestamp() };
        if (txnCourseLocation == 8) {
          // Logged time at finish line, we're done!
          myUpdate.completed = true;
        }
    
        txn.update(docRef, myUpdate);
      });
    } catch (e) {
      this.messageService.add("Mark Time Failed: " + e);
    }
  }

  async scratchRoll(timer: TimerDetail) {
    // If there are no times logged yet, scratch means remove
    // entirely.

    const docRef = doc(this.timerDataService.getTimerCollection(),
                       timer.id);

    try {
      await runTransaction(this.store, async(txn) => {
        const snap = await txn.get(docRef);
        if (!snap.exists()) {
          throw "Timer " + timer.id + " doesn't exist?";
        }

        const t = snap.data() as TimerDetail;
        let foundOne = false;
        let p: keyof CourseTimes;
        for (p in t.absoluteTimes) {
          if (t.absoluteTimes[p] != null) {
            foundOne = true;
            break;
          }
        }

        if (foundOne) {
          // Roll has started, we issue an update.
          txn.update(docRef, { completed: true });
        } else {
          // Roll not started, delete it.
          txn.delete(docRef);
        }
      });
    } catch (e) {
      this.messageService.add("Scratch/DNF Failed: " + e);
    }
  }

  // Verify we are still the most recent location, then remove our time if so.
  async tryUndo(timer: TimerDetail) {
    const docRef = doc(this.timerDataService.getTimerCollection(),
                       timer.id);

    const updateKey = "absoluteTimes.T" + this.courseLocationNumeric;
    const txnCourseLocation = this.courseLocationNumeric;

    try {
      await runTransaction(this.store, async(txn) => {
        const snap = await txn.get(docRef);
        if (!snap.exists()) {
          throw "Timer" + timer.id + "doesn't exist?";
        }

        const t = snap.data() as TimerDetail;
        const et = new ExtendedTimerDetail(t);
        if (et.lastSeenAt != null && et.lastSeenAt != txnCourseLocation) {
          return Promise.reject("Roll was not last seen here.  It has a time from " +
                                et.lastSeenAtString +
                                " therefore we cannot undo at " +
                                TIMING_SITE_NAMES[txnCourseLocation]);
        }

        let myUpdate : any = { [updateKey]: null };
        txn.update(docRef, myUpdate);
      });
    } catch (e) {
      this.messageService.add("Undo Failed: " + e);
    }
  }

}
