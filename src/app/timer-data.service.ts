import { Injectable, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Firestore, collectionData, collection,
         query, where, orderBy, CollectionReference } from '@angular/fire/firestore';

import { BehaviorSubject, Observable, map, Subscription } from 'rxjs';

import { TimerDetail, ExtendedTimerDetail } from './timer-detail/timer-detail';

// This service provides 2 types of timer data:
//
// getPendingTimers() : Observable<ExtendedTimerDetail[]>;
// A BehaviorSubject that returns all uncompleted rolls, used in the timing entry view.
//
// getDataViewTimers(Date) : Observable<TimerDetail[]>;
// A BehaviorSubject that returns all rolls on one specific day.  If the requested day is a different day,
// the query is changed to the new day.  This has the obvious implication that it cannot be
// used by different views trying to cache different days, as they will thrash and possibly interfere with eachother.
@Injectable({
  providedIn: 'root'
})
export class TimerDataService implements OnDestroy {
  timerCollection : CollectionReference = collection(this.store, 'Timers');

  pendingTimersObs$ : Observable<ExtendedTimerDetail[]> | null = null;
  pendingTimers$ : BehaviorSubject<ExtendedTimerDetail[]> | null = null;
  pendingTimersSub : Subscription | null = null;

  dataViewDateString : string = "";
  dataViewTimersObs$ : Observable<TimerDetail[]> | null = null;
  dataViewTimers$ : BehaviorSubject<TimerDetail[]> | null = null;
  dataViewTimersSub : Subscription | null = null;

  constructor(private store: Firestore,
              private datePipe: DatePipe) { }

  ngOnDestroy() {
    if (this.pendingTimersSub != null) {
      this.pendingTimersSub.unsubscribe();
    }

    if (this.dataViewTimersSub != null) {
      this.dataViewTimersSub.unsubscribe();
    }
  }

  private initPendingTimers() {
    if (this.pendingTimers$ != null) {
      throw("Duplicate initPendingTimers call?");
    }
    const timerQuery = query(
      this.timerCollection, where("completed", "!=", true),
      orderBy("completed"), orderBy("creationTime"));

    let rawtimers$ = collectionData(timerQuery, { idField: 'id' }) as Observable<TimerDetail[]>;
    this.pendingTimersObs$ = rawtimers$.pipe(map((inTimers) => {
      let out : ExtendedTimerDetail[] = [];
      inTimers.forEach((t) => {
        out.push(new ExtendedTimerDetail(t));
      });
      return out;
    }));

    this.pendingTimers$ = new BehaviorSubject([] as ExtendedTimerDetail[]);
    this.pendingTimersSub = this.pendingTimersObs$.subscribe(this.pendingTimers$);

    console.log("Pending Timer Data: Set To Go");
  }

  public getPendingTimers() : Observable<ExtendedTimerDetail[]> {
    if (this.pendingTimers$ == null) {
      this.initPendingTimers();
    }
    return this.pendingTimers$ as Observable<ExtendedTimerDetail[]>;
  }

  public getDataViewTimers(day: Date) : Observable<TimerDetail[]> {
    const newDateString = this.datePipe.transform(day, "yyyy-MM-dd");
    if (newDateString == null) {
      throw ("Error parsing date in getDataViewTimers");
    }

    if (this.dataViewDateString == null ||
        this.dataViewDateString != newDateString) {
      console.log("Resetting the DataView Observable to: " + newDateString);

      // Unsubscribe the existing behaviorSubject here
      if (this.dataViewTimersSub != null) {
        this.dataViewTimersSub.unsubscribe();
      }

      this.dataViewDateString = newDateString;

      const dataViewQuery = query(this.timerCollection,
        where("date", '==', this.dataViewDateString),
        orderBy("creationTime", "desc"));

      this.dataViewTimersObs$ = collectionData(
        dataViewQuery, { idField: 'id' }) as Observable<TimerDetail[]>;

      this.dataViewTimers$ = new BehaviorSubject([] as TimerDetail[]);
      this.pendingTimersSub = this.dataViewTimersObs$.subscribe(
        this.dataViewTimers$);
    }

    if (this.dataViewTimers$ == null) {
      throw("Unexpected null dataViewTimers$ at end of getDataViewtimers");
    }

    return this.dataViewTimers$;
  }

  public getTimerCollection() : CollectionReference {
    return this.timerCollection;
  }
}
