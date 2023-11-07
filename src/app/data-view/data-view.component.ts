import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

import { FormControl } from '@angular/forms';

import { TimerDetail } from '../timer-detail/timer-detail';

import { Observable } from 'rxjs';
import { Firestore, CollectionReference, collection, collectionData, doc,
         Query, query, orderBy, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent {
  timerCollection : CollectionReference = collection(this.store, 'Timers');

  displayDate = new FormControl(new Date());

  timerQuery = this.buildQuery();
  timers$ = this.refreshTimers();

  constructor(private store: Firestore, private datePipe: DatePipe) { };

  getCsv() : void {
    console.log("csv dump not implemented");
    return; // todo
  }

  dateChange() {
    this.timerQuery = this.buildQuery();
    this.timers$ = this.refreshTimers();
  }

  private buildQuery() : Query {
    const dateString = this.datePipe.transform(this.displayDate.value, "yyyy-MM-dd");

    // We order by descending creation time so that (most likely) the most recent rolls show first.
    // This may not be ideal for, say, generating a CSV though.
    return query(this.timerCollection, where("date", '==', dateString), orderBy("creationTime", "desc"));
  }

  private refreshTimers() : Observable<TimerDetail[]> {
    return collectionData(this.timerQuery, { idField: 'id' }) as Observable<TimerDetail[]>;
  }
}
