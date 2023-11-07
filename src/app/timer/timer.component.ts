import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Firestore, CollectionReference, collection, collectionData, doc,
         addDoc, deleteDoc, updateDoc,
         runTransaction,
         query, orderBy, where,
         serverTimestamp } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

import { BuggyPickerComponent, BuggyPickerResult } from '../buggy-picker/buggy-picker.component';

import { CourseTimes, TimerDetail } from '../timer-detail/timer-detail';



// For faking data, roughly 8:20am 11/6/23
const recentStamp = 1699277096;

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent {
  // What a mess.  MatButtonToggle "functions as a checkbox" but isn't a boolean.  WTF.
  // So, if it is "true" then we show all the unfinished.  I guess if this is empty it is false?
  showAllUnfinished: string[] = ["true"];
  courseLocation: string = "";


  timerCollection : CollectionReference = collection(this.store, 'Timers');
  timerQuery = query(this.timerCollection, where("completed", "!=", true),
                     orderBy("completed"), orderBy("creationTime"));
  timers$ = collectionData(this.timerQuery, { idField: 'id' }) as Observable<TimerDetail[]>;
  // TODO filter$ timers further based on if there are times after my location and showAllUnfnished setting


  constructor(private dialog: MatDialog, private datePipe: DatePipe, private store: Firestore) {}

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

  markTime(timer: TimerDetail) {
    const validLocationTags = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
    const locationTag = this.courseLocation.charAt(0);
    if (!validLocationTags.includes(locationTag)) {
      // TODO better error handling (messages?)
      console.log("unknown location tag in marktime: " + this.courseLocation)
      return;
    }

    // TODO Transactionally update this time field.
    // TODO: Fail update if this or downstream time has arrived already
    // TODO: Fail if roll is now scratched
    // TOOD: Fail if roll is unstarted and we aren't a starter location (0 or 2)
    const docRef = doc(this.timerCollection, timer.id);
    const updateKey = "absoluteTimes.T" + locationTag;
    console.log("Marking time for: " + timer.id + " at " + this.courseLocation + " via " + updateKey);
    
    let myUpdate : any = { [updateKey]: serverTimestamp() };
    if (locationTag == "8") {
      // Logged time at finish line, we're done!
      myUpdate.completed = true;
    }

    updateDoc(docRef, myUpdate);
  }

  async scratchRoll(timer: TimerDetail) {
    // If there are no times logged yet, scratch means remove
    // entirely.

    const docRef = doc(this.timerCollection, timer.id);

    try {
      await runTransaction(this.store, async(txn) => {
        const t = await txn.get(docRef);
        if (!t.exists()) {
          throw "Timer" + timer.id + "doesn't exist?";
        }

        let foundOne = false;
        let p: keyof CourseTimes;
        for (p in timer.absoluteTimes) {
          if (timer.absoluteTimes[p] != null) {
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
