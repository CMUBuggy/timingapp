import { TestBed } from '@angular/core/testing';

import { TimerConversionService } from './timer-conversion.service';

describe('TimerConversionService', () => {
  let service: TimerConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerConversionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
