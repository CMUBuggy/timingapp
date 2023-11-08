import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { BuggyDetail } from '../buggy-detail/buggy-detail';
import { BuggyDialogComponent, BuggyDialogResult } from '../buggy-dialog/buggy-dialog.component';

import { Firestore, CollectionReference, collection, collectionData, doc,
         addDoc, deleteDoc, setDoc, updateDoc,
         query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BuggyDataService } from '../buggy-data.service';

@Component({
  selector: 'app-buggy-config',
  templateUrl: './buggy-config.component.html',
  styleUrls: ['./buggy-config.component.css']
})
export class BuggyConfigComponent {
  buggyCollection : CollectionReference = collection(this.store, 'Buggies');
  buggyQuery = query(this.buggyCollection, orderBy("org"), orderBy("name"));
  filteredOrg: string = "";
  buggies$: Observable<BuggyDetail[]>;
  orgList$: Observable<string[]>;

  constructor(
    private dialog: MatDialog,
    private store: Firestore,
    private buggyService: BuggyDataService
  ) {
    this.buggies$ = this.buggyService.getAllBuggies();
    this.orgList$ = this.buggyService.getAllOrgList();
  }

  newBuggy() : void {
    const dialogRef = this.dialog.open(BuggyDialogComponent, {
      width: '270px',
      data: {
        buggy: { active: true },
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: BuggyDialogResult|undefined) => {
        if (!result) {
          return;
        }
        //this.buggies.push(result.buggy);
        addDoc(this.buggyCollection, result.buggy);
      });
  }

  editBuggy(buggy: BuggyDetail) : void {
    const dialogRef = this.dialog.open(BuggyDialogComponent, {
      width: '270px',
      data: {
        buggy
      },
    });
    dialogRef.afterClosed().subscribe((result: BuggyDialogResult|undefined) => {
      if (!result) {
        return;
      }

      let updatedBuggy : BuggyDetail = {...result.buggy};
      delete updatedBuggy.id; // give a hoot, don't pollute.

      // Note: Not a transaction, force DB to fit the current UI.
      setDoc(doc(this.buggyCollection, buggy.id), updatedBuggy);
    });
  }

  toggleActive(buggy : BuggyDetail) {
    // Note: Not a transaction, force to fit the current UI.
    buggy.active = !buggy.active;  // Update the current state before firestore catches up.

    updateDoc(doc(this.buggyCollection, buggy.id), { active: buggy.active });
  }

  deleteBuggy(buggy: BuggyDetail) {
    deleteDoc(doc(this.buggyCollection, buggy.id));
  }
}
