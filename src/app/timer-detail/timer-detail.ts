import { BuggyDetail } from "../buggy-detail/buggy-detail";
import { FieldValue, Timestamp } from "@angular/fire/firestore";

// Because firestore is array-hostile, we encode the times as a sub-object.
export interface CourseTimes {
    [key: string] : any;
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

export interface TimerDetail {
    id?: string;
    date: string; // YYYY-MM-DD (day of roll for queries)
    creationTime: Timestamp | FieldValue; // Time of creation (for sorting in timer display)
    completed: boolean; // True if this has reached an end state (has a final time or marked as a scratch)
    buggy : BuggyDetail;
    absoluteTimes : CourseTimes;  // For now, seconds since epoch, eventually, Firestore Timestamp objects.
}