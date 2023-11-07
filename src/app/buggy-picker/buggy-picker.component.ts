import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable, map } from 'rxjs';
import { Firestore, CollectionReference, collection, collectionData, doc,
         query, orderBy, where } from '@angular/fire/firestore';

import { BuggyDetail } from '../buggy-detail/buggy-detail';



@Component({
  selector: 'app-buggy-picker',
  templateUrl: './buggy-picker.component.html',
  styleUrls: ['./buggy-picker.component.css']
})
export class BuggyPickerComponent {
  // TODO To schedule a roll, we also need to at least pick a class (default to all gender?).
  // "Buggy Picker" may not be a great name :)

  // This should come from a query that filters out inactive buggies _and_ possibly filters by org.
  buggyCollection : CollectionReference = collection(this.store, 'Buggies');
  buggyQuery = query(this.buggyCollection, where("active", '==', true), orderBy("org"), orderBy("name"));
  filteredOrg: string = "";
  buggies$: Observable<BuggyDetail[]>;
  orgList : string[] = [];

  // error handling through messages, eventually
  //todo$ = this.todoClean$.pipe(catchError(err => of([{id: 'ERR', title: 'Error', description: err}])));

  constructor(
    public dialogRef: MatDialogRef<BuggyPickerComponent>,
    private store: Firestore,
    @Inject(MAT_DIALOG_DATA) public inputData: BuggyPickerData
  ) {

    // TODO this definately should be a service with a BehaviorSubject to not reread all the
    // buggies each time!  This service should also offer both an active and an inactive
    // set of buggies, as well as the org list.  Ugh.
    let rawbuggies$ = collectionData(this.buggyQuery, { idField: 'id' }) as Observable<BuggyDetail[]>;
    this.buggies$ = rawbuggies$.pipe(map((buggies => {
      // Generate a set of unique org names from all of our buggies.
      let orgMap = new Map<string, boolean>;

      buggies.forEach((b) => {
        orgMap.set(b.org, true);
      });
      this.orgList = Array.from(orgMap.keys()).sort();
      console.log(JSON.stringify(this.orgList));

      // We've processed it into our org list, pass it on.
      return buggies;
    })));
  }

  select(selectedBuggy : BuggyDetail) : void {
    this.dialogRef.close({ buggy: selectedBuggy });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
export interface BuggyPickerData {
  // No input.  Possible future input allows selection of inactive buggies or defaults the org?
}

export interface BuggyPickerResult {
  buggy: BuggyDetail;
}