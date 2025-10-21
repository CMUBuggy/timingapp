import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BuggyDetail } from './buggy-detail';

@Component({
    selector: 'buggy-detail',
    templateUrl: './buggy-detail.component.html',
    styleUrls: ['./buggy-detail.component.css'],
    standalone: false
})
export class BuggyDetailComponent {
  @Input() buggy: BuggyDetail | null = null;
  @Output() edit = new EventEmitter<BuggyDetail>();
  @Output() toggleActive = new EventEmitter<BuggyDetail>();
  @Output() delete = new EventEmitter<BuggyDetail>();
}
