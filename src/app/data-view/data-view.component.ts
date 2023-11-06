import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

import { FormControl } from '@angular/forms';

import { TimerDetail } from '../timer-detail/timer-detail';

import { Observable } from 'rxjs';
import { Firestore, CollectionReference, collection, collectionData, doc,
         query, orderBy, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent {
  displayDate = new FormControl(new Date());
  // This should come from a query that filters out inactive buggies _and_ possibly filters by org.
  dateString = this.datePipe.transform(new Date(),"yyyy-MM-dd");

  timerCollection : CollectionReference = collection(this.store, 'Timers');
  timerQuery = query(this.timerCollection, where("date", '==', this.dateString));
  timers$ = collectionData(this.timerQuery, { idField: 'id' }) as Observable<TimerDetail[]>;

  constructor(private store: Firestore, private datePipe: DatePipe) { };

  getCsv() : void {
    console.log(this.displayDate.value);
    console.log(this.dateString);
    console.log("csv dump not implemented");
    return; // todo
  }
}
