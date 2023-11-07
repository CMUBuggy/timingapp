import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, CollectionReference, collection, collectionData, doc,
         query, orderBy, where } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription, map, tap } from 'rxjs';

import { BuggyDetail } from './buggy-detail/buggy-detail';

// This class provides 3 things:
//   An up-to-date array of all the unique org names of
//   all buggies and 
//
//   BehaviorSubjects to be used for both All and Active
//   buggies.

@Injectable({
  providedIn: 'root'
})
export class BuggyDataService implements OnDestroy {
  private buggyCollection : CollectionReference = collection(this.store, 'Buggies');
  private buggyQuery = query(this.buggyCollection, orderBy("org"), orderBy("name"));

  private allBuggiesObservable$: Observable<BuggyDetail[]>;
  private allBuggies$ : BehaviorSubject<BuggyDetail[]>;
  private allBuggiesSub : Subscription;
  private activeBuggiesObservable$: Observable<BuggyDetail[]>;
  private activeBuggies$ : BehaviorSubject<BuggyDetail[]>;
  private activeBuggiesSub : Subscription;
  private allOrgList$: BehaviorSubject<string[]> = new BehaviorSubject([] as string[]);
  private activeOrgList$: BehaviorSubject<string[]> = new BehaviorSubject([] as string[]);

  // This sets up the entire chain of observables, starting from a query that is
  // sorted by org and name for _all_ buggies from firestore.
  //
  // This means we don't go back to firestore every time we need to load more buggies.
  //
  // Unique org lists are also generated locally as new data comes in from firestore,
  // as a tap() off of the all-buggy list, and in line with the map() that finds
  // the active buggies.
  constructor(private store: Firestore) {
    let rawbuggies$ = collectionData(this.buggyQuery, { idField: 'id' }) as Observable<BuggyDetail[]>;
    this.allBuggiesObservable$ = rawbuggies$.pipe(tap((buggies => {
      let orgList = getUniqueOrgs(buggies);
      this.allOrgList$.next(orgList);
      // console.log("All Buggies: " + JSON.stringify(buggies))
      // console.log("All Orgs: " + JSON.stringify(orgList));
    })));

    this.allBuggies$ = new BehaviorSubject([] as BuggyDetail[]);
    this.allBuggiesSub = this.allBuggiesObservable$.subscribe(this.allBuggies$);

    // Set up the active buggy list using a map, and grab the unique
    // orgs at the same time.
    this.activeBuggiesObservable$ = this.allBuggies$.pipe(map(buggies => {
      let actives: BuggyDetail[] = [];
      buggies.forEach((b) => {
        if (b.active) {
          actives.push(b);
        }
      });

      let orgList = getUniqueOrgs(actives);
      this.activeOrgList$.next(orgList);

      // console.log("Active Buggies: " + JSON.stringify(actives));
      // console.log("Active Orgs: " + JSON.stringify(orgList));

      return actives;
    }));

    this.activeBuggies$ = new BehaviorSubject([] as BuggyDetail[]);
    this.activeBuggiesSub = this.activeBuggiesObservable$.subscribe(this.activeBuggies$);

    console.log("Buggy Service Set To Go");
  }

  ngOnDestroy(): void {
    this.activeBuggiesSub.unsubscribe();
    this.allBuggiesSub.unsubscribe();
  }

  // All users should use one of these methods to access the buggy data.
  public getAllBuggies(): Observable<BuggyDetail[]> {
    return this.allBuggies$;  // Technically, a BehaviorSubject.
  }
  public getActiveBuggies(): Observable<BuggyDetail[]> {
    return this.activeBuggies$;  // Technically, a BehaviorSubject.
  }
  public getAllOrgList(): Observable<string[]> {
    // Return a copy
    return this.allOrgList$;
  }
  public getActiveOrgList(): Observable<string[]> {
    // Return a copy
    return this.activeOrgList$;
  }
}

function getUniqueOrgs(buggies: BuggyDetail[]): string[] {
  // Generate a set of unique org names from a set of buggies.
  let orgMap = new Map<string, boolean>;

  buggies.forEach((b) => {
    orgMap.set(b.org, true);
  });

  return Array.from(orgMap.keys()).sort();
}