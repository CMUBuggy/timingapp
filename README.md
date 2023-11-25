# Buggy Timing Web App

## Operation

In general, the use of this app proceeds in 3 phases:  Configuring the available buggies, timing rolls, and then exporting the output.

### Buggy Configuration

You can add and remove buggies on the "Buggy Config" tab.  To add a buggy, use the "Add Buggy" button, and provide a name, org, and optionally a smugmug image tag.

The smugmug image slug is derived from the smugmug URL.  For example, "Black Magic" might use the image from `https://photos.smugmug.com/photos/i-dkBSSTZ/0/S/i-dkBSSTZ-S.jpg`, for which the relevant "slug" is "`i-dkBSSTZ`".  This is case sensitive and should not include the size portion of the tag (in this case, "`-S`").  The UI should give a preview of the selected image to help determine if it is working.

Removing a buggy can be done with the "Delete" button.  Likewise, modifying a buggy (name, org, image) can be done with the "Edit" button.  However, when a roll is scheduled the buggy data is copied into the roll, and thus any edits that are made are not transfered to any rolls that have already been scheduled before the edit.  Likewise, deleting a buggy will not remove the buggy data from any past rolls that happened with that buggy.

Configuring all but the active set is best done before showing up at freerolls, especially if adding images.  Ideally, you can get the list of currently caped buggies from the Sweepstakes committee, and have an entry for each of them in the database.

In a pinch, adding buggies without images is possible, and they can be later edited to have the image tag added.  However, as noted above, any rolls that are recorded persist the exact state of the buggy record, so the rolls themselves will forever be without an image attached.

#### Activating Buggies

The morning of rolls, you can use the "Active" button on each buggy to select the buggies that are actually available that day.  Only "Active" buggies will be available to select for scheduling a roll.

This allows a larger roster of buggies to be maintained.  However, it is recommended to keep the full configured roster relatively small, as anyone who entiers the configuration page will download the entire set to their phone.  This isn't the place for a historical set of buggies to be stored.

### Timing Rolls

Timing is accomplied on the "Time Entry" pane.  Each volunteer should select their relevant position from the drop down.

One user will need to schedule rolls of new buggies.  This is done with the "Schedule Roll" button, which allows you to select any of the active buggies to roll, as well as _optionally_ assigning them a class and team (e.g. "Women's B").  Class and team can be omitted by using the "Skip" button on the relevant dialog.

Timing itself is straightforward -- to either start a roll or enter a time at your selected position, simply tap the top half of the card for the relevant buggy.

You can use the "show all unfinished" button to toggle between showing _all_ active rolls, and only the rolls that have not yet passed your location (even though you cannot take an action on these rolls except for marking as DNF).

Only the Start and Crosswalk positions can add the initial time for a roll -- and no other station can enter a time before this happens.  After that, times can only be entered by stations _after_ the most recent timestamp on the roll.  (e.g. Crosswalk cannot enter a time if there is a Stop Sign time already entered).

Incomplete rolls can be terminated with the red "Scratch"/"DNF" button.  A roll that is "Scratched" (e.g. unstarted) is removed from the set of rolls entirely.  Once started, a roll can be marked "DNF" which removes it from the actively rolling buggies, but keeps any times that have been recorded so far.

It is possible to undo a time event if it was made in error as long as no later station has marked their own time for the same roll.  This can be done using the "undo" button if you have "show all unfinished" enabled.  Note that because it completes the roll, the Finish Line location cannot perform an undo (as the roll becomes immutable once it is completed).

#### Tips

You will likely want at least 3 volunteers to do useful timing and at least get splits of the Freeroll and Back Hills.  These would be in order of importance: Crosswalk, Finish Line, and Hill 3 Line.  After that, depending on the splits you desire to time, you can add Start (for Front Hills), and each of the hill transitions.  The Stop Sign and Chute Flag are likely the least useful positions to staff.

If you are staffing it, the Hill 1-2 transition position can be useful for coordinating with organizations on their next roll as it is not critical for starting buggies.  As much as possible, it is helpful to enter the buggies in the order they are expected to roll down the hill, so that each volunteer, in the common case, only needs to tap the topmost buggy on the list.

Having a back channel for text chat among the volunteers can be useful, especially to allow notes to be taken if a volunteer knows thay have an inaccurate time for a given roll.

While it is not a problem for a single user to swap between positions in the app, obviously this increases the chance of error.

Having good images of the buggies can be exceptionally helpful to the volunteers, who may not come out to rolls every week and therefore may not recognize buggies by name or only subtle differences.  This is another reason that keeping the buggies in their roll order, as much as possible, can be helpful.

### Export Output

You can review the times for all rolls on a given day on the "Data View" pane.  These rolls can also be exported to CSV (one day at a time).


## Development

### Firebase
This app makes use of [FireStore](https://firebase.google.com/docs/firestore) as its backing database.  Data resides in 2 collections: "Buggies" (containing documents representing the available buggies to roll), and "Timers" (contaning one document for each role).

You will need to provide the relevant Javascript app configuration (which can be generated by the Firebase web console) in the contents of `src/environments/environments.ts` or `src/environments/environments.dev.ts`.  The database does not need to be prepopuatled with any data.

Built versions of the code can be deployed to any static content server, which should rewrite (but not redirect) all urls to point at `index.html`.  The app will perform its own internal routing.

Note that for simplicity of getting up and running during freerolls with volunteers this is not an authenticated application, so the Firebase security rules for a given instance may allow unknown users to write to that DB.  Therefore, it is recommended to at least disable writes to the database while rolls are not being actively timed.

### Code
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.9.

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## History

This app was based on a https://bubble.io app that was originally written by Ben Matzke.  It was rewritten with a more constrained set of features to use Firebase by Rob Siemborski after Bubble effectively removed its free tier.