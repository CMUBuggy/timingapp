import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuggyPickerComponent } from './buggy-picker.component';

describe('BuggyPickerComponent', () => {
  let component: BuggyPickerComponent;
  let fixture: ComponentFixture<BuggyPickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuggyPickerComponent]
    });
    fixture = TestBed.createComponent(BuggyPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
