import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Timestamp } from '@angular/fire/firestore';

import { saveAs } from 'file-saver-es';

import { TimerDetail } from './timer-detail/timer-detail';

// TODO Combine with conversion stuff in DataViewEntry

// Used for converting from firebase Timestamp objects.
export interface AbsoluteMillisecondTimes {
  T0: number | null; // Start
  T1: number | null; // 1-2 Trans
  T2: number | null; // Crosswalk
  T3: number | null; // Stop Sign
  T4: number | null; // Chute Flag
  T5: number | null; // Hill 3 Line
  T6: number | null; // 3-4 Trans
  T7: number | null; // 4-5 Trans
  T8: number | null; // Finish
}

// Splits to the tenth of a second.
export interface TimeSplitTenths {
  hill1: number | null;         // T1 - T0
  hill2: number | null;         // T2 - T1
  fronthills: number | null;    // T2 - T0
  stopsign: number | null;      // T3 - T0
  crosswalkStop: number | null; // T3 - T2
  freeroll: number | null;      // T5 - T2
  hill3: number | null;         // T6 - T5
  hill4: number | null;         // T7 - T6
  hill5: number | null;         // T8 - T7
  backhills: number | null;     // T8 - T5
  crosswalkFull: number | null; // T8 - T2
  full: number | null;          // T8 - T0
}

// Converts a firestore Timestamp to raw milliseconds
export function convertTime(t : Timestamp) : number {
  return t.seconds * 1000 + (t.nanoseconds / 1000000);
}

export function getAbsoluteMillisecondTimes(t: TimerDetail): AbsoluteMillisecondTimes {
  let a = t.absoluteTimes;
  let ret: AbsoluteMillisecondTimes =
    { T0: null, T1: null, T2: null, T3: null,
      T4: null, T5: null, T6: null, T7: null, T8: null };

  if (a != null) {
    ret = {
      T0: (a.T0 != null) ? convertTime(a.T0) : null,
      T1: (a.T1 != null) ? convertTime(a.T1) : null,
      T2: (a.T2 != null) ? convertTime(a.T2) : null,
      T3: (a.T3 != null) ? convertTime(a.T3) : null,
      T4: (a.T4 != null) ? convertTime(a.T4) : null,
      T5: (a.T5 != null) ? convertTime(a.T5) : null,
      T6: (a.T6 != null) ? convertTime(a.T6) : null,
      T7: (a.T7 != null) ? convertTime(a.T7) : null,
      T8: (a.T8 != null) ? convertTime(a.T8) : null
    }
  }

  return ret;
}

export function getTimingSplits(a: AbsoluteMillisecondTimes): TimeSplitTenths {
  let ret: TimeSplitTenths =
    { hill1: null, hill2: null, hill3: null, hill4: null, hill5: null,
      fronthills: null, freeroll: null, backhills: null,
      stopsign: null, crosswalkStop: null,
      crosswalkFull: null, full: null };

  if (a.T1 && a.T0) {
    ret.hill1 = roundSplit(a.T1, a.T0);
  }
  if (a.T2 && a.T1) {
    ret.hill2 = roundSplit(a.T2, a.T1);
  }

  if (a.T3 && a.T0) {
    ret.stopsign = roundSplit(a.T3, a.T0);
  }
  if (a.T3 && a.T2) {
    ret.crosswalkStop = roundSplit(a.T3, a.T2);
  }

  if (a.T2 && a.T0) {
    ret.fronthills = roundSplit(a.T2, a.T0);
  }

  if (a.T5 && a.T2) {
    ret.freeroll = roundSplit(a.T5, a.T2);
  }

  if (a.T6 && a.T5) {
    ret.hill3 = roundSplit(a.T6, a.T5);
  }
  if (a.T7 && a.T6) {
    ret.hill4 = roundSplit(a.T7, a.T6);
  }
  if (a.T8 && a.T7) {
    ret.hill5 = roundSplit(a.T8, a.T7);
  }

  if (a.T8 && a.T5) {
    ret.backhills = roundSplit(a.T8, a.T5);
  }

  if (a.T8 && a.T2) {
    ret.crosswalkFull = roundSplit(a.T8, a.T2);
  }
  if (a.T8 && a.T0) {
    ret.full = roundSplit(a.T8, a.T0);
  }

  return ret;
}

@Injectable({
  providedIn: 'root'
})
export class TimerConversionService {
  constructor(private datePipe: DatePipe) { }

  csvDownloadTimers(globalData: TimerDetail[]) {
    const headers: string[] =
      [ "CreationTime",
        "Org", "Buggy", "RollMarkedComplete", "RollDNF",
        "Start", "12Trans", "Crosswalk",
        "StopSign", "ChuteFlag", "Hill3Line",
        "34Trans", "45Trans", "Finish",
        "S-Hill1", "S-Hill2",
        "S-Hill3", "S-Hill4", "S-Hill5",
        "S-Fronthills", "S-StopSign",
        "S-CrosswalkStopSign",
        "S-Freeroll", "S-Backhills",
        "S-Crosswalk-Full", "S-Full" ];
    if (!globalData || !globalData.length) {
      // Don't generate an empty file
      return;
    }

    const separator = ',';
    const csvContent: string =
      headers.join(separator) + "\n" +
      globalData
        .map((rowData: TimerDetail) => {
          const b = rowData.buggy;
          const creationStamp =
            this.datePipe.transform(convertTime(rowData.creationTime as Timestamp),
                                                "yyyy-MM-dd HH:mm:ss");
          const t = getAbsoluteMillisecondTimes(rowData);
          const s = getTimingSplits(t);
          const cols = [
            creationStamp,
            b.org.replaceAll('\"', '').replaceAll(',', ''),
            b.name.replaceAll('\"', '').replaceAll(',', ''),
            rowData.completed, (!rowData.completed || t.T8 == null),
            numOrEmpty(t.T0),
            numOrEmpty(t.T1), numOrEmpty(t.T2),
            numOrEmpty(t.T3), numOrEmpty(t.T4),
            numOrEmpty(t.T5), numOrEmpty(t.T6),
            numOrEmpty(t.T7), numOrEmpty(t.T8),
            numOrEmpty(s.hill1), numOrEmpty(s.hill2),
            numOrEmpty(s.hill3), numOrEmpty(s.hill4), numOrEmpty(s.hill5),
            numOrEmpty(s.fronthills), numOrEmpty(s.stopsign),
            numOrEmpty(s.crosswalkStop),
            numOrEmpty(s.freeroll), numOrEmpty(s.backhills),
            numOrEmpty(s.crosswalkFull), numOrEmpty(s.full),
          ];
          return cols.join(separator);
        }).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    saveAs(blob, "timingdata.csv");
  }
}

function numOrEmpty(t: number | null): string {
  if (t == null) {
    return "";
  } else {
    return String(t);
  }
}

// Computes time between two millisecond timestamps in seconds rounded to tenths.
function roundSplit(to: number, from: number) : number {
  if (to < from) {
    throw("First time after second in roundSplit()");
  }
  let t = to - from;
  return Number((t/1000).toFixed(1));
}
