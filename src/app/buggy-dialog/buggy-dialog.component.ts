import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BuggyDetail } from '../buggy-detail/buggy-detail';

@Component({
    selector: 'app-buggy-dialog',
    templateUrl: './buggy-dialog.component.html',
    styleUrls: ['./buggy-dialog.component.css'],
    standalone: false
})
export class BuggyDialogComponent {
  public workingBuggy: Partial<BuggyDetail> = { ...this.inputData.buggy };

  constructor(
    public dialogRef: MatDialogRef<BuggyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public inputData: BuggyDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close();
  }
}

export interface BuggyDialogData {
  buggy: Partial<BuggyDetail>;
}

export interface BuggyDialogResult {
  buggy: BuggyDetail;
}

