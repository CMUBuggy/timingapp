import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { BuggyDetail } from '../buggy-detail/buggy-detail';
import { BuggyDialogComponent, BuggyDialogResult } from '../buggy-dialog/buggy-dialog.component';

import { Firestore, CollectionReference, collection, collectionData, doc,
         addDoc, deleteDoc, setDoc,
         query, orderBy } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-buggy-config',
  templateUrl: './buggy-config.component.html',
  styleUrls: ['./buggy-config.component.css']
})
export class BuggyConfigComponent {
  buggyCollection : CollectionReference = collection(this.store, 'Buggies');
  buggyQuery = query(this.buggyCollection, orderBy("org"), orderBy("name"));
  filteredOrg: string = "";
  orgList: string[] = [];
  buggies$: Observable<BuggyDetail[]>;

  // error handling through messages, eventually
  //todo$ = this.todoClean$.pipe(catchError(err => of([{id: 'ERR', title: 'Error', description: err}])));

  constructor(private dialog: MatDialog, private store: Firestore) {
    // TODO see note in BuggyPickerComponent about how we want a BuggyListService to share

    let rawbuggies$ = collectionData(this.buggyQuery, { idField: 'id' }) as Observable<BuggyDetail[]>;
    this.buggies$ = rawbuggies$.pipe(map((buggies => {
      // Generate a set of unique org names from all of our buggies.
      let orgMap = new Map<string, boolean>;

      buggies.forEach((b) => {
        orgMap.set(b.org, true);
      });
      this.orgList = Array.from(orgMap.keys()).sort();

      // We've processed it into our org list, pass it on.
      return buggies;
    })));
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
      // Note: Not a transaction, force DB to fit the current UI.
      setDoc(doc(this.buggyCollection, buggy.id), result.buggy);
    });
  }

  toggleActive(buggy : BuggyDetail) {
    // Note: Not a transaction, force to fit the current UI.
    buggy.active = !buggy.active;
    setDoc(doc(this.buggyCollection, buggy.id), buggy);
  }

  deleteBuggy(buggy: BuggyDetail) {
    /*
    const taskIndex = this.buggies.indexOf(buggy);
    this.buggies.splice(taskIndex, 1);
    */
    deleteDoc(doc(this.buggyCollection, buggy.id));
  }
}
