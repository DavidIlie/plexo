export interface PlexLibrarySection {
   key: string;
   type: string;
   title: string;
   agent: string;
   scanner: string;
   language: string;
   uuid: string;
}

export interface PlexStream {
   id: number;
   streamType: number;
   codec: string;
   channels?: number;
   bitrate?: number;
   samplingRate?: number;
   bitDepth?: number;
   audioChannelLayout?: string;
   displayTitle?: string;
   extendedDisplayTitle?: string;
}

export interface PlexPart {
   id: number;
   key: string;
   file?: string;
   size?: number;
   container?: string;
   duration?: number;
   Stream?: PlexStream[];
}

export interface PlexMedia {
   id: number;
   duration?: number;
   bitrate?: number;
   width?: number;
   height?: number;
   videoResolution?: string;
   videoCodec?: string;
   audioChannels?: number;
   audioCodec?: string;
   container?: string;
   Part?: PlexPart[];
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
   Media?: PlexMedia[];
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
