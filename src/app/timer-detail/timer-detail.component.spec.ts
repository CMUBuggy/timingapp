import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerDetailComponent } from './timer-detail.component';

describe('TimerDetailComponent', () => {
  let component: TimerDetailComponent;
  let fixture: ComponentFixture<TimerDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TimerDetailComponent]
    });
    fixture = TestBed.createComponent(TimerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
