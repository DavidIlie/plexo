export interface OverseerrMedia {
   id: number;
   tmdbId: number;
   mediaType: "movie" | "tv";
   status: number;
}

export interface OverseerrRequestUser {
   id: number;
   displayName: string;
}

export interface OverseerrRequest {
   id: number;
   status: number;
   type: "movie" | "tv";
   media: OverseerrMedia;
   requestedBy: OverseerrRequestUser;
   createdAt: string;
   updatedAt: string;
}

export interface OverseerrRequestsResponse {
   pageInfo: {
      pages: number;
      pageSize: number;
      results: number;
      page: number;
   };
   results: OverseerrRequest[];
}

export interface WishlistItem {
   tmdbId: number;
   mediaType: "movie" | "tv";
   title: string;
   year: string;
   posterPath: string | null;
   status: "pending" | "approved" | "processing" | "available";
   requestedBy: string;
   requestedAt: string;
}
