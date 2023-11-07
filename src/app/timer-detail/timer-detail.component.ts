import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ExtendedTimerDetail, TimerDetail } from './timer-detail';

@Component({
  selector: 'timer-detail',
  templateUrl: './timer-detail.component.html',
  styleUrls: ['./timer-detail.component.css']
})
export class TimerDetailComponent {
  @Input() timer: ExtendedTimerDetail | null = null;
  @Output() timeevent = new EventEmitter<TimerDetail>();
  @Output() scratch = new EventEmitter<TimerDetail>();
}
