import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable, map } from 'rxjs';
import { Firestore, CollectionReference, collection, collectionData, doc,
         query, orderBy, where } from '@angular/fire/firestore';

import { BuggyDetail, RolledBuggyDetail, getRolledData } from '../buggy-detail/buggy-detail';
import { BuggyDataService } from '../buggy-data.service';


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
  orgList$ : Observable<string[]>;

  // error handling through messages, eventually
  //todo$ = this.todoClean$.pipe(catchError(err => of([{id: 'ERR', title: 'Error', description: err}])));

  constructor(
    public dialogRef: MatDialogRef<BuggyPickerComponent>,
    private store: Firestore,
    private buggyService: BuggyDataService,
    @Inject(MAT_DIALOG_DATA) public inputData: BuggyPickerData
  ) {

    this.buggies$ = this.buggyService.getActiveBuggies();
    this.orgList$ = this.buggyService.getActiveOrgList();
  }

  select(selectedBuggy : BuggyDetail) : void {
    this.dialogRef.close({ buggy: getRolledData(selectedBuggy) });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
export interface BuggyPickerData {
  // No input.  Possible future input allows selection of inactive buggies or defaults the org?
}

export interface BuggyPickerResult {
  buggy: RolledBuggyDetail;
}