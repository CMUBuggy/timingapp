import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable, takeLast, takeWhile } from 'rxjs';

import { BuggyDetail, RolledBuggyDetail, getRolledData } from '../buggy-detail/buggy-detail';
import { BuggyDataService } from '../buggy-data.service';


@Component({
    selector: 'app-buggy-picker',
    templateUrl: './buggy-picker.component.html',
    styleUrls: ['./buggy-picker.component.css'],
    standalone: false
})
export class BuggyPickerComponent {
  filteredOrg: string;
  buggies$: Observable<BuggyDetail[]>;
  orgList$ : Observable<string[]>;

  constructor(
    public dialogRef: MatDialogRef<BuggyPickerComponent>,
    private buggyService: BuggyDataService,
    @Inject(MAT_DIALOG_DATA) public inputData: BuggyPickerData
  ) {
    this.buggies$ = this.buggyService.getActiveBuggies();
    this.orgList$ = this.buggyService.getActiveOrgList();

    this.filteredOrg = inputData.defaultOrg;

    // Check to make sure we were handed a valid filtered org.
    //
    // Naturally, we only bother to do this if we are given a default org filter.
    if (this.filteredOrg != "") {
      // The org list is initialized to an empty array before we read anything.  But an empty array is not
      // useful here.
      //
      // So, we pipe off of the orglist, ignoring any empty array, and returning the first non-empty value we see.
      this.orgList$.pipe(takeWhile(t => { return t.length == 0; }, true),
                         takeLast(1)).subscribe(orgSet => {
        // If the filteredOrg has already changed while waiting for the subscription, abort.
        if (this.filteredOrg != inputData.defaultOrg) {
          return;
        }

        // Otherwise, clear the filtered org if it is no longer available.
        if (!orgSet.includes(this.filteredOrg)) {
          this.filteredOrg = "";
        }
      });
    }
  }

  select(selectedBuggy : BuggyDetail) : void {
    this.dialogRef.close({ buggy: getRolledData(selectedBuggy),
                           nextDefaultOrg: this.filteredOrg });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
export interface BuggyPickerData {
  // TODO: Possible future input allows selection of inactive buggies?
  defaultOrg : string;  // Empty string means "all orgs";
}

export interface BuggyPickerResult {
  buggy: RolledBuggyDetail;
  nextDefaultOrg: string;  // If selected org was changed, it will be returned here.
}