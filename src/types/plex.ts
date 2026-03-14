export interface PlexLibrarySection {
   key: string;
   type: string;
   title: string;
   agent: string;
   scanner: string;
   language: string;
   uuid: string;
}

export interface PlexMediaItem {
   ratingKey: string;
   key: string;
   type: string;
   title: string;
   titleSort?: string;
   summary?: string;
   year?: number;
   thumb?: string;
   art?: string;
   duration?: number;
   addedAt: number;
   updatedAt?: number;
   viewCount?: number;
   lastViewedAt?: number;
   contentRating?: string;
   rating?: number;
   audienceRating?: number;
   studio?: string;
   Genre?: PlexTag[];
   Director?: PlexTag[];
   Role?: PlexTag[];
   leafCount?: number;
   viewedLeafCount?: number;
   childCount?: number;
   grandparentTitle?: string;
   parentTitle?: string;
   parentIndex?: number;
   index?: number;
}

export interface PlexTag {
   id?: number;
   tag: string;
}

export interface PlexGenre {
   key: string;
   title: string;
}

export interface PlexMediaContainer<T> {
   MediaContainer: {
      size: number;
      totalSize?: number;
      offset?: number;
      Metadata?: T[];
      Directory?: T[];
   };
}

export interface PlexOnDeckItem extends PlexMediaItem {
   grandparentTitle?: string;
   grandparentRatingKey?: string;
   parentTitle?: string;
   grandparentThumb?: string;
   parentThumb?: string;
}
