import { TestBed } from '@angular/core/testing';

import { TimerDataService } from './timer-data.service';

describe('TimerDataService', () => {
  let service: TimerDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
