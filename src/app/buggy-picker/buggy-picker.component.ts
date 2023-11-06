import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable } from 'rxjs';
import { Firestore, CollectionReference, collection, collectionData, doc,
         query, orderBy, where } from '@angular/fire/firestore';

import { BuggyDetail } from '../buggy-detail/buggy-detail';



@Component({
  selector: 'app-buggy-picker',
  templateUrl: './buggy-picker.component.html',
  styleUrls: ['./buggy-picker.component.css']
})
export class BuggyPickerComponent {
  // This should come from a query that filters out inactive buggies _and_ possibly filters by org.
  buggyCollection : CollectionReference = collection(this.store, 'Buggies');
  buggyQuery = query(this.buggyCollection, where("active", '==', true), orderBy("org"), orderBy("name"));
  buggies$ = collectionData(this.buggyQuery, { idField: 'id' }) as Observable<BuggyDetail[]>;

    // error handling through messages, eventually
  //todo$ = this.todoClean$.pipe(catchError(err => of([{id: 'ERR', title: 'Error', description: err}])));
  buggies: BuggyDetail[] = [
    { name: "Rage", org: "SDC", smugmugSlug: "i-cdD3Qrq", active: true },
    { name: "Conquest", org: "CIA", smugmugSlug: "i-dPKQMJF", active: true },
    { name: "Mystery", org: "Robobuggy", active: true }
  ];

  constructor(
    public dialogRef: MatDialogRef<BuggyPickerComponent>,
    private store: Firestore,
    @Inject(MAT_DIALOG_DATA) public inputData: BuggyPickerData
  ) {}

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