import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuggyConfigComponent } from './buggy-config.component';

describe('BuggyConfigComponent', () => {
  let component: BuggyConfigComponent;
  let fixture: ComponentFixture<BuggyConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuggyConfigComponent]
    });
    fixture = TestBed.createComponent(BuggyConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
