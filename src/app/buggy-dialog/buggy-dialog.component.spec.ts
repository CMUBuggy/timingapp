import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuggyDialogComponent } from './buggy-dialog.component';

describe('BuggyDialogComponent', () => {
  let component: BuggyDialogComponent;
  let fixture: ComponentFixture<BuggyDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuggyDialogComponent]
    });
    fixture = TestBed.createComponent(BuggyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
