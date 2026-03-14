export interface TautulliResponse<T> {
   response: {
      result: string;
      message: string | null;
      data: T;
   };
}

export interface TautulliHistoryItem {
   reference_id: number;
   row_id: number;
   id: number;
   date: number;
   started: number;
   stopped: number;
   duration: number;
   play_duration: number;
   paused_counter: number;
   user: string;
   friendly_name: string;
   platform: string;
   product: string;
   player: string;
   title: string;
   parent_title: string;
   grandparent_title: string;
   full_title: string;
   media_type: string;
   year: number;
   thumb: string;
   parent_thumb: string;
   grandparent_thumb: string;
   rating_key: number;
   parent_rating_key: number;
   grandparent_rating_key: number;
   ip_address: string;
   watched_status: number;
   group_count: number;
   group_ids: string;
   media_index: number;
   parent_media_index: number;
   transcode_decision: string;
}

export interface TautulliHistoryData {
   recordsFiltered: number;
   recordsTotal: number;
   data: TautulliHistoryItem[];
   draw: number;
   filter_duration: string;
   total_duration: string;
}

export interface TautulliPlaysByDate {
   categories: string[];
   series: Array<{
      name: string;
      data: number[];
   }>;
}

export interface TautulliPlaysByDayOfWeek {
   categories: string[];
   series: Array<{
      name: string;
      data: number[];
   }>;
}

export interface TautulliPlaysByHourOfDay {
   categories: string[];
   series: Array<{
      name: string;
      data: number[];
   }>;
}

export interface TautulliHomeStatItem {
   stat_id: string;
   stat_type: string;
   stat_title: string;
   rows: Array<{
      title: string;
      total_plays: number;
      total_duration: number;
      thumb: string;
      art: string;
      rating_key: number;
      section_id: number;
      media_type: string;
      grandparent_thumb?: string;
      users_watched?: number;
      last_play?: number;
   }>;
}
