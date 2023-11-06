import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViewEntryComponent } from './data-view-entry.component';

describe('DataViewEntryComponent', () => {
  let component: DataViewEntryComponent;
  let fixture: ComponentFixture<DataViewEntryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataViewEntryComponent]
    });
    fixture = TestBed.createComponent(DataViewEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
