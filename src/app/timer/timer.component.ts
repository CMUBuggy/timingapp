import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Firestore, CollectionReference, collection, collectionData, doc,
         addDoc, deleteDoc, updateDoc,
         runTransaction,
         query, orderBy, where,
         serverTimestamp } from '@angular/fire/firestore';

import { Observable, map } from 'rxjs';

import { BuggyPickerComponent, BuggyPickerResult } from '../buggy-picker/buggy-picker.component';

import { TIMING_SITE_NAMES, CourseTimes, TimerDetail, ExtendedTimerDetail } from '../timer-detail/timer-detail';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent {
  // What a mess.  MatButtonToggle "functions as a checkbox" but isn't a boolean.  WTF.
  // So, if it is "true" then we show all the unfinished.  I guess if this is empty it is false?
  showAllUnfinished: string[] = [""];
  courseLocation: string = "";
  courseLocationNumeric: number = -1;

  // We always grab all current rolls.  The UI will filter based on current location and
  // the showAllUnfinished setting.  This means fewer DB reads.
  timerCollection : CollectionReference = collection(this.store, 'Timers');
  timerQuery = query(this.timerCollection, where("completed", "!=", true),
                     orderBy("completed"), orderBy("creationTime"));
  timers$ : Observable<ExtendedTimerDetail[]>;

  constructor(private dialog: MatDialog, private datePipe: DatePipe, private store: Firestore) {
    let rawtimers$ = collectionData(this.timerQuery, { idField: 'id' }) as Observable<TimerDetail[]>;
    this.timers$ = rawtimers$.pipe(map((inTimers) => {
      let out : ExtendedTimerDetail[] = [];
      inTimers.forEach((t) => {
        out.push(new ExtendedTimerDetail(t)); 
      });
      return out;
    }));
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

  addRoll() : void {
    // Open dialog to pick from available buggies to start a roll with
    // Start roll with current date, selected buggy, and blanked out aboslute times.
    // 
    // TODO: Technically this is not sufficient, we need to at least specify a class as well.
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

        let today = this.datePipe.transform(new Date(),"yyyy-MM-dd");
        if (!today) {
          // TODO this is a huge hack to avoid a null string that is basically not possible to occur
          today = "1920-01-01";
        }

        let newTimer : TimerDetail = {
          date: today,
          creationTime: serverTimestamp(),
          completed: false,
          buggy: { ...result.buggy },
          absoluteTimes: { T0: null, T1: null, T2: null, T3: null,
                           T4: null, T5: null, T6: null, T7: null, T8: null }
        }

        // Sanitize the new item here
        // TODO technically we don't need the active tag any more either
        delete newTimer.buggy.id;

        addDoc(this.timerCollection, newTimer)
      });
  }

  async markTime(timer: TimerDetail) {
    // TODO better error handling (messages in UI, not just console log)

    // This first error is really the only one we can safely detect outside the
    // transaction context, since it indicates our local state isn't properly
    // configured.
    if (this.courseLocationNumeric < 0 || this.courseLocationNumeric > 8) {
      console.log("unknown location tag in marktime: " + this.courseLocationNumeric)
      return;
    }

    const docRef = doc(this.timerCollection, timer.id);
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
      console.log("Mark Time Transaction Failed: ", e);
    }
  }

  async scratchRoll(timer: TimerDetail) {
    // If there are no times logged yet, scratch means remove
    // entirely.

    const docRef = doc(this.timerCollection, timer.id);

    try {
      await runTransaction(this.store, async(txn) => {
        const snap = await txn.get(docRef);
        if (!snap.exists()) {
          throw "Timer" + timer.id + "doesn't exist?";
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
      console.log("Scratch Transaaction Failed: ", e);
    }
  }
}
