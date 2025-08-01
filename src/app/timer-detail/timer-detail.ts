import { RolledBuggyDetail } from "../buggy-detail/buggy-detail";
import { FieldValue, Timestamp } from "@angular/fire/firestore";

// Because firestore is array-hostile, we encode the times as a sub-object.
export interface CourseTimes {
    T0: Timestamp | null;  // Start
    T1: Timestamp | null;  // 1-2 Trans
    T2: Timestamp | null;  // Crosswalk
    T3: Timestamp | null;  // Stop Sign
    T4: Timestamp | null;  // Chute Flag
    T5: Timestamp | null;  // Hill 3 Line
    T6: Timestamp | null;  // 3-4 Trans
    T7: Timestamp | null;  // 4-5 Trans
    T8: Timestamp | null;  // Finish Line
}

// TODO maybe this file shouldn't be a part of the timer detail component, since this is
// used in several places.
//
// Timers as represented in Firestore.  Buggy data is copied & frozen when timer is created.
export interface TimerDetail {
    id?: string;
    date: string; // YYYY-MM-DD (day of roll for queries)
    creationTime: Timestamp | FieldValue; // Time of creation (for sorting in timer display)
    completed: boolean; // True if this has reached an end state (has a final time or marked as a scratch)
    buggy : RolledBuggyDetail;
    absoluteTimes : CourseTimes;  // Firestore Timestamp objects.

    // Optional fields
    class? : string;
    team? : string;
}

// TODO seems this should be in a more common place?
export const TIMING_SITE_NAMES = ["Start", "1-2 Transition", "Crosswalk",
                                  "Stop Sign", "Chute Flag", "Hill 3 Line",
                                  "3-4 Transition", "4-5 Transition",
                                  "Finish Line"];

export function getClassName(classChar: string | undefined) {
    if (classChar === undefined) {
        return "";
    }
    switch(classChar) {
        case "A":
          return "All Gender";
        case "M":
          return "Men's";
        case "W":
          return "Women's";
        default:
          return "Unknown";
    }
}

export function getClassTeamString(classChar: string | undefined,
                                   teamChar: string | undefined){
    if (classChar === undefined || teamChar === undefined) {
        return "";
    }

    return getClassName(classChar) + " " + teamChar;
}

export class ExtendedTimerDetail {
    // Number of station where buggy was last seen (corresponds to db.absoluteTimes)
    public lastSeenAt : number | null;
    public lastSeenAtString : string;

    // The timestamp at the last seen station, _or_ the creation time if no station has
    // seen the buggy yet.  Used for sorting.
    public lastSeenAtTimestampMillis : number;

    constructor(public db: TimerDetail) {
        this.lastSeenAt = -1;
        this.lastSeenAtTimestampMillis = (db.creationTime instanceof Timestamp) ? db.creationTime.toMillis() : 0;

        let p: Extract<keyof CourseTimes, string>;
        for (p in db.absoluteTimes) {
            let thisTime = db.absoluteTimes[p]; // Defeat Typescript Null Check
            if (thisTime != null) {
                let current = Number(p.charAt(1)) // Relies on specific field name format.
                if (current > this.lastSeenAt) {
                    this.lastSeenAt = current;
                    this.lastSeenAtTimestampMillis = thisTime.toMillis();
                }
            }
        }
        if (this.lastSeenAt < 0 || this.lastSeenAt > 8) {
            this.lastSeenAt = -1;
            this.lastSeenAtString = "Not Started"
        } else {
            this.lastSeenAtString = TIMING_SITE_NAMES[this.lastSeenAt];
        }
    }
}