const { exit } = require('process');

// Firestore Init
const admin = require('firebase-admin');
admin.initializeApp({
//  credential: admin.credential.applicationDefault()
  credential: admin.credential.cert('./appengine-cred.json')
});
const db = admin.firestore();

const myArgs = process.argv.slice(2);

if (myArgs.length < 1) {
    console.error('Please supply <date string> (date to GC before)');
    console.error('Date String is in the form YYYY-MM-DD');
    exit();
}

let DRY_RUN = true;

if (myArgs.length < 2 || myArgs[1].toLowerCase() != "commit") {
    console.log("DRY RUN -> Provide 'commit' as second parameter to execute.")
} else {
    console.log("LIVE RUN -> Deleting Entries!");
    DRY_RUN = false;
}

console.log(myArgs);
const dateString = myArgs[0];

// Sanity check
const DAYS_OLD = 28;
const DAYS_OLD_MILLIS = DAYS_OLD * 86400 * 1000;
const reqDate = Date.parse(dateString)
const safeDate = Date.now() - DAYS_OLD_MILLIS;

if (isNaN(reqDate)) {
    console.log("'" + dateString + "' does not look like a date.");
    exit();
}
if (reqDate > safeDate) {
    console.log ("Too soon.  Must be at least one month in the past.");
    exit();
}

const timerCollectionRef = db.collection("Timers");
const q = timerCollectionRef.where('date', '<=', dateString);

db.runTransaction(t => {
    return q.get()
      .then(snap => {
        snap.forEach(doc => {
            console.log(doc.data().date + " / " + doc.data().buggy.name);
            if (!DRY_RUN) {
              doc.ref.delete();
            }
        });
    })
    .catch((err) => {
      console.error('Transaction failed:', err);
    });
})


