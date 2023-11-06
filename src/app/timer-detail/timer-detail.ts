import { BuggyDetail } from "../buggy-detail/buggy-detail";

export interface TimerDetail {
    id?: string;
    date: string; // YYYY-MM-DD
    buggy : BuggyDetail;
    absoluteTimes : (number | undefined)[];  // For now, seconds since epoch, eventually, Firestore Timestamp objects.
}