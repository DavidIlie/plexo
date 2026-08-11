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
   user_id: number;
   user_thumb: string;
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
   guid: string;
}

type TautulliNumber = number | string;

export interface TautulliActivitySession {
   session_key: TautulliNumber;
   session_id: string;
   state: string;
   media_type: string;
   title: string;
   parent_title: string;
   grandparent_title: string;
   full_title: string;
   year: TautulliNumber;
   rating_key: TautulliNumber;
   parent_rating_key: TautulliNumber;
   grandparent_rating_key: TautulliNumber;
   media_index: TautulliNumber;
   parent_media_index: TautulliNumber;
   duration: TautulliNumber;
   view_offset: TautulliNumber;
   progress_percent: TautulliNumber;
   thumb: string;
   parent_thumb: string;
   grandparent_thumb: string;
   art: string;
   user_id: TautulliNumber;
   platform: string;
   product: string;
   player: string;
   device: string;
   quality_profile: string;
   bandwidth: TautulliNumber;
   bitrate: TautulliNumber;
   stream_bitrate: TautulliNumber;
   container: string;
   stream_container: string;
   transcode_decision: string;
   video_decision: string;
   audio_decision: string;
   subtitle_decision: string;
   video_full_resolution: string;
   video_resolution: string;
   video_codec: string;
   video_dynamic_range: string;
   stream_video_full_resolution: string;
   stream_video_resolution: string;
   stream_video_codec: string;
   stream_video_dynamic_range: string;
   stream_video_decision: string;
   audio_codec: string;
   audio_channels: TautulliNumber;
   audio_channel_layout: string;
   stream_audio_codec: string;
   stream_audio_channels: TautulliNumber;
   stream_audio_channel_layout: string;
   stream_audio_decision: string;
   subtitle_codec: string;
   subtitle_language: string;
   stream_subtitle_codec: string;
   stream_subtitle_language: string;
   stream_subtitle_decision: string;
   transcode_hw_decoding: TautulliNumber;
   transcode_hw_encoding: TautulliNumber;
   transcode_throttled: TautulliNumber;
}

export interface TautulliActivityData {
   sessions: TautulliActivitySession[];
   stream_count: TautulliNumber;
   total_bandwidth: TautulliNumber;
   lan_bandwidth: TautulliNumber;
   wan_bandwidth: TautulliNumber;
}

export interface TautulliUser {
   row_id: number;
   user_id: number;
   username: string;
   friendly_name: string;
   thumb: string | null;
   is_active: number;
   keep_history: number;
}

export type ViewerDisplayMode =
   | "hidden"
   | "avatar"
   | "name"
   | "avatar-name";

export interface ActivityViewer {
   id: string;
   label: string;
   name?: string;
   showAvatar: boolean;
   hasAvatar: boolean;
}

export interface CurrentActivitySession {
   sessionKey: string;
   state: string;
   mediaType: string;
   title: string;
   parentTitle: string;
   grandparentTitle: string;
   fullTitle: string;
   year: number;
   ratingKey: string;
   parentRatingKey: string;
   grandparentRatingKey: string;
   mediaIndex: number;
   parentMediaIndex: number;
   durationMs: number;
   viewOffsetMs: number;
   progressPercent: number;
   thumb: string;
   parentThumb: string;
   grandparentThumb: string;
   art: string;
   qualityProfile: string;
   bandwidthKbps: number;
   sourceBitrateKbps: number;
   streamBitrateKbps: number;
   sourceContainer: string;
   streamContainer: string;
   transcodeDecision: string;
   videoDecision: string;
   audioDecision: string;
   subtitleDecision: string;
   sourceVideoResolution: string;
   sourceVideoCodec: string;
   sourceVideoDynamicRange: string;
   streamVideoResolution: string;
   streamVideoCodec: string;
   streamVideoDynamicRange: string;
   streamVideoDecision: string;
   sourceAudioCodec: string;
   sourceAudioChannels: string;
   streamAudioCodec: string;
   streamAudioChannels: string;
   streamAudioDecision: string;
   subtitleCodec: string;
   subtitleLanguage: string;
   streamSubtitleDecision: string;
   hardwareTranscode: boolean;
   transcodeThrottled: boolean;
   platform?: string;
   product?: string;
   player?: string;
   device?: string;
   viewer?: ActivityViewer;
}

export interface CurrentActivityData {
   sessions: CurrentActivitySession[];
   streamCount: number;
   totalBandwidthKbps: number;
}

export type ActivityHistoryItem = Omit<
   TautulliHistoryItem,
   "user" | "user_id" | "user_thumb" | "friendly_name"
> & {
   viewer?: ActivityViewer;
};

export interface ActivityHistoryData
   extends Omit<TautulliHistoryData, "data"> {
   data: ActivityHistoryItem[];
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
