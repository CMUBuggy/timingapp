import { Pipe, PipeTransform } from '@angular/core';

export interface BuggyDetail {
    id?: string;
    name: string;
    org: string;
    active: boolean;
    smugmugSlug?: string;
}


@Pipe({ name: 'buggyThumbnail' })
export class BuggyThumbnailPipe implements PipeTransform {
  transform(slug: string): string {
    return "https://photos.smugmug.com/photos/"
           + slug + "/0/Th/" + slug + "-Th.jpg";
  }
}