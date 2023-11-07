import { TestBed } from '@angular/core/testing';

import { BuggyDataService } from './buggy-data.service';

describe('BuggyDataService', () => {
  let service: BuggyDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuggyDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
