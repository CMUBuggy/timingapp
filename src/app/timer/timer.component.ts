import { DatePipe } from '@angular/common';
import { Component, Pipe,
         EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Firestore, doc,
         addDoc, runTransaction,
         serverTimestamp,
         DocumentReference,
         DocumentSnapshot,
         Transaction } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

import { BuggyPickerComponent, BuggyPickerResult } from '../buggy-picker/buggy-picker.component';
import { ClassPickerComponent, ClassPickerResult } from '../class-picker/class-picker.component';

import { TIMING_SITE_NAMES, CourseTimes, TimerDetail, ExtendedTimerDetail } from '../timer-detail/timer-detail';

import { TimerDataService } from '../timer-data.service';
import { MessageService } from '../message.service';

@Pipe({
    name: 'localTimerSort',
    standalone: false
})
export class LocalTimerSort {
  // The timer data we pull down from firestore is sorted by creation date.  However, for the
  // list of timers, it is better to do something more complex -- we want the buggies to be
  // listed in the order that they presently are on the course, regardless of when the
  // timer was first created.  This is something that we can't really ask firestore to do
  // directly in its query language.  We need to do two things:
  //
  // First, sort by the latest location to have seen any buggy.  For example, a buggy that has
  // its most recent time recorded at hill 3 is always further along than a buggy that has its
  // most recent time recorded at the crosswalk.  A buggy with no recorded location sorts
  // last (consider this a virtual "pending" location).
  //
  // If two buggies have their most recent recorded time at the same location, then sort them
  // by which arrived at that location first.
  //
  // If neither buggy has any recorded times (they are both "pending"), sort them by their
  // creation time (effectively, their "arrival" at the virtual "pending" location).
  //
  // We want the furthest along buggy to sort at the top of the list, thus it must sort the _lowest_.
  //
  // ---
  //
  // The result of this effort is that we reduce the importance of knowing the specific
  // order the buggies will be dropped in when they are entered initially, as well as
  // deal with dynamic order changes due to passes or other events once the roll is underway.
  //
  // It does, however, increase the odds that a buggy will change order while the roll is underway,
  // leading to a potential misclick when the UI shifts.
  transform(value: ExtendedTimerDetail[] | null): ExtendedTimerDetail[] {
    if (value == null) {
      // Seems reasonable to turn a null into an empty array here.
      return [];
    }

    return value.slice().sort((a : ExtendedTimerDetail, b : ExtendedTimerDetail) => {
      if (a == null || b == null ||
          a.lastSeenAt == null || b.lastSeenAt == null) {
        // Garbage in, garbage Out
        return 0;
      }

      // lastSeenAt -1 means not started / pending, and is thus lower than any real position.
      //
      // ExtendedTimerDetail also translates the creation time into lastSeenAtTimestampMillis
      // in this case
      if (a.lastSeenAt < b.lastSeenAt) {
        return 1;
      } else if (a.lastSeenAt > b.lastSeenAt) {
        return -1;
      } else {
        return a.lastSeenAtTimestampMillis - b.lastSeenAtTimestampMillis;
      }
    })
  }
}

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.css'],
    standalone: false
})
export class TimerComponent {
  // What a mess.  MatButtonToggle "functions as a checkbox" but isn't a boolean.  WTF.
  // So, if it is "true" then we show all the unfinished.  I guess if this is empty it is false?
  showAllFilters: string[] = ["unready"];
  hideUnready: boolean = false;
  showPastMe: boolean = false;
  
  multiStartEnabled: boolean = false;
  multiStartSelected: Map<string, TimerDetail> = new Map<string, TimerDetail>();

  courseLocation: string = "";
  courseLocationNumeric: number = -1;
  buggyPickerDefaultOrg: string = "";

  // We always grab all pending rolls.  The UI will filter based on current location and
  // the showAllUnfinished setting.  This means fewer DB reads.
  timers$ : Observable<ExtendedTimerDetail[]>;

  private injector : EnvironmentInjector = inject(EnvironmentInjector);

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

  private clearMultiStart(): void {
    this.multiStartSelected = new Map<string, TimerDetail>();
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

    // New location always resets multistart to false.
    this.multiStartEnabled = false;
    this.clearMultiStart();
  }

  toggleMultiStart(): void {
    this.multiStartEnabled = !this.multiStartEnabled;
    this.clearMultiStart();
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

          runInInjectionContext(this.injector,
            () => addDoc(this.timerDataService.getTimerCollection(), newTimer)
                    .catch(error =>
                      { this.messageService.add("New Roll Creation error: " + error); }));
        });
      });
  }

  multiStartGo(): void {
    console.log("GO!");
  }

  async markTime(timer: TimerDetail) {
    // This first error is really the only one we can safely detect outside the
    // transaction context, since it indicates our local state isn't properly
    // configured.
    if (this.courseLocationNumeric < 0 || this.courseLocationNumeric > 8) {
      this.messageService.add("Not logging time, invalid location id: " + this.courseLocationNumeric);
      return;
    }

    // Multistart markTime just means we store the id until we're ready to go.
    if (this.multiStartEnabled) {
      if(timer.id == undefined) {
        this.messageService.add("markTime without an id?");
        return;
      }
      if (this.courseLocationNumeric != 0) {
        this.messageService.add("multiStart not at start line?");
        return;
      }

      if(this.multiStartSelected.has(timer.id)) {
        this.multiStartSelected.delete(timer.id);
      } else {
        this.multiStartSelected.set(timer.id, timer);
      }

      return;
    }

    const docRef = runInInjectionContext(this.injector,
                      () => doc(this.timerDataService.getTimerCollection(), timer.id));
    const updateKey = "absoluteTimes.T" + this.courseLocationNumeric;
    const txnCourseLocation = this.courseLocationNumeric;
    console.log("Marking time for: " + timer.id + " at '" +
                TIMING_SITE_NAMES[txnCourseLocation] + "' via " + updateKey);

    try {
      await runInInjectionContext(this.injector, async () => {
        runTransaction(this.store, async(txn) => {
          const snap = await txn.get(docRef);
          if (!snap.exists()) {
            throw "Timer" + timer.id + "doesn't exist?";
          }

          return this.markOneTime(timer, docRef, txnCourseLocation, updateKey, snap, txn);
      })});
    } catch (e) {
      let error : string = "Mark Time Failed: " + e;
      this.messageService.add(error);
      return Promise.reject(error);
    }
  }

  // This method will update a single timer within a transaction and return the promise for that.
  // Remember that all reads for the transaction must be done before this method is called, as it
  // will write into the transaction.
  private async markOneTime(timer: TimerDetail,
                            docRef: DocumentReference,
                            txnCourseLocation: number,
                            updateKey: string,
                            snap : DocumentSnapshot,
                            txn : Transaction) {
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
        return Promise.resolve();
  }

  async scratchRoll(timer: TimerDetail) {
    // If there are no times logged yet, scratch means remove
    // entirely.

    const docRef = runInInjectionContext(this.injector,
                     () => doc(this.timerDataService.getTimerCollection(), timer.id));

    try {
      await runInInjectionContext(this.injector, async () => {
        runTransaction(this.store, async(txn) => {
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
      })});
    } catch (e) {
      this.messageService.add("Scratch/DNF Failed: " + e);
    }
  }

  // Verify we are still the most recent location, then remove our time if so.
  async tryUndo(timer: TimerDetail) {
    const docRef = runInInjectionContext(this.injector,
                     () => doc(this.timerDataService.getTimerCollection(), timer.id));

    const updateKey = "absoluteTimes.T" + this.courseLocationNumeric;
    const txnCourseLocation = this.courseLocationNumeric;

    try {
      await runInInjectionContext(this.injector, async () => {
        runTransaction(this.store, async(txn) => {
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
      })});
    } catch (e) {
      this.messageService.add("Undo Failed: " + e);
    }
  }

}
