import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-class-picker',
    templateUrl: './class-picker.component.html',
    styleUrls: ['./class-picker.component.css'],
    standalone: false
})
export class ClassPickerComponent {
  class: string = "A";
  team: string = "A";

  constructor(
    public dialogRef: MatDialogRef<ClassPickerComponent>,
    @Inject(MAT_DIALOG_DATA) public inputData: ClassPickerData
  ) {}

  select(takeResult: boolean) : void {
    this.dialogRef.close({ confirmed: takeResult, class: this.class, team: this.team });
  }

  cancel() {
    this.dialogRef.close();
  }
}

export interface ClassPickerData {
  // No input.
}

export interface ClassPickerResult {
  confirmed: boolean;
  class: string;
  team: string;
}