import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { BuggyDetail } from '../buggy-detail/buggy-detail';
import { BuggyDialogComponent, BuggyDialogResult } from '../buggy-dialog/buggy-dialog.component';

@Component({
  selector: 'app-buggy-config',
  templateUrl: './buggy-config.component.html',
  styleUrls: ['./buggy-config.component.css']
})
export class BuggyConfigComponent {
  buggies: BuggyDetail[] = [
    { name: "Rage", org: "SDC", smugmugSlug: "i-cdD3Qrq", active: true },
    { name: "Conquest", org: "CIA", smugmugSlug: "i-dPKQMJF", active: false },
    { name: "Mystery", org: "Robobuggy", active: true }
  ]

  constructor(private dialog: MatDialog) {}

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
        this.buggies.push(result.buggy);
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
      const taskIndex = this.buggies.indexOf(buggy);
      this.buggies[taskIndex] = result.buggy;
    });
  }

  toggleActive(buggy : BuggyDetail) {
    buggy.active = !buggy.active;
  }

  deleteBuggy(buggy: BuggyDetail) {
    const taskIndex = this.buggies.indexOf(buggy);
    this.buggies.splice(taskIndex, 1);
  }

  newTask() {
    return;
  }
}
