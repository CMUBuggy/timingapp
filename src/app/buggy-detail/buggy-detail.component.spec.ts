import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuggyDetailComponent } from './buggy-detail.component';

describe('BuggyDetailComponent', () => {
  let component: BuggyDetailComponent;
  let fixture: ComponentFixture<BuggyDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuggyDetailComponent]
    });
    fixture = TestBed.createComponent(BuggyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
