import { Pipe, PipeTransform } from '@angular/core';

// The data that we need to have about a buggy for a specific timer.
//
// Keep it minimal as this is copied into every buggy timer the buggy
// appears in.
export interface RolledBuggyDetail {
  name: string;
  org: string;
  smugmugSlug?: string;
}

// Additional data that we need about a buggy to manage buggies.
export interface BuggyDetail extends RolledBuggyDetail {
    id?: string;
    active: boolean;
}

export function getRolledData(b: BuggyDetail): RolledBuggyDetail {
  let retVal: RolledBuggyDetail =  { name: b.name, org: b.org };
  if ('smugmugSlug' in b) {
    retVal.smugmugSlug = b.smugmugSlug;
  }
  return retVal;
}

@Pipe({ name: 'buggyThumbnail' })
export class BuggyThumbnailPipe implements PipeTransform {
  transform(slug: string): string {
    return "https://photos.smugmug.com/photos/"
           + slug + "/0/Th/" + slug + "-Th.jpg";
  }
}