import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "~/lib/cache-tags";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getArtists,
   getSectionTotalSize,
   getSectionItems,
} from "~/lib/plex";
import {
   getHistory,
   getGeoipLookup,
   getLibraryMediaInfo,
} from "~/lib/tautulli";
import { env } from "~/env";

export const getGenreDistributionCached = async () => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("genreDistribution"), CACHE_TAGS.plex);

   const sections = await getLibrarySections();
   const genreCounts = new Map<string, number>();

   for (const section of sections) {
      if (section.type !== "movie" && section.type !== "show") continue;
      const items =
         section.type === "movie"
            ? await getMovies(section.key)
            : await getShows(section.key);

      for (const item of items.items) {
         if (item.Genre) {
            for (const genre of item.Genre) {
               genreCounts.set(genre.tag, (genreCounts.get(genre.tag) ?? 0) + 1);
            }
         }
      }
   }

   return Array.from(genreCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
};

export const getTopWatchedGenresCached = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("topWatchedGenres"), CACHE_TAGS.plex, CACHE_TAGS.tautulli);

   const history = await getHistory(500);
   const sections = await getLibrarySections();
   const movieSection = sections.find((s) => s.type === "movie");
   const showSection = sections.find((s) => s.type === "show");

   const allItems = new Map<string, string[]>();

   if (movieSection) {
      const movies = await getMovies(movieSection.key);
      for (const movie of movies.items) {
         if (movie.Genre) {
            allItems.set(movie.ratingKey, movie.Genre.map((g) => g.tag));
         }
      }
   }

   if (showSection) {
      const shows = await getShows(showSection.key);
      for (const show of shows.items) {
         if (show.Genre) {
            allItems.set(show.ratingKey, show.Genre.map((g) => g.tag));
         }
      }
   }

   const genrePlayCounts = new Map<string, number>();
   for (const histItem of history.data) {
      const key = String(histItem.grandparent_rating_key || histItem.rating_key);
      const genres = allItems.get(key);
      if (genres) {
         for (const genre of genres) {
            genrePlayCounts.set(genre, (genrePlayCounts.get(genre) ?? 0) + 1);
         }
      }
   }

   return Array.from(genrePlayCounts.entries())
      .map(([name, plays]) => ({ name, plays }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
};

export const getMediaTypeRatioCached = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("mediaTypeRatio"), CACHE_TAGS.tautulli);

   const history = await getHistory(1000);

   let moviePlays = 0;
   let tvPlays = 0;
   let musicPlays = 0;

   for (const item of history.data) {
      if (item.media_type === "movie") {
         moviePlays++;
      } else if (item.media_type === "episode" || item.media_type === "show") {
         tvPlays++;
      } else if (item.media_type === "track") {
         musicPlays++;
      }
   }

   const result = [
      { name: "Movies", value: moviePlays },
      { name: "TV Shows", value: tvPlays },
   ];
   if (musicPlays > 0) {
      result.push({ name: "Music", value: musicPlays });
   }
   return result;
};

export const getHighlightsCached = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("highlights"), CACHE_TAGS.plex, CACHE_TAGS.tautulli);

   const history = await getHistory(5000);
   const sections = await getLibrarySections();
   const movieSection = sections.find((s) => s.type === "movie");
   const showSection = sections.find((s) => s.type === "show");

   const playCounts = new Map<string, { ratingKey: string; title: string; plays: number; type: string; thumb: string }>();
   for (const item of history.data) {
      const key = String(item.grandparent_rating_key || item.rating_key);
      const title = item.grandparent_title || item.title;
      const existing = playCounts.get(key);
      if (existing) {
         existing.plays++;
      } else {
         playCounts.set(key, {
            ratingKey: key,
            title,
            plays: 1,
            type: item.media_type,
            thumb: item.grandparent_thumb || item.thumb,
         });
      }
   }

   const sorted = Array.from(playCounts.values()).sort((a, b) => b.plays - a.plays);

   const mostWatched = sorted[0] ?? null;

   const rewatched = sorted.filter((i) => i.plays > 1);
   const mostRewatched = rewatched.length > 0 ? rewatched[0] : null;

   let longestMovie: { ratingKey: string; title: string; duration: number; thumb: string } | null = null;
   if (movieSection) {
      const movies = await getMovies(movieSection.key);
      for (const movie of movies.items) {
         if (movie.duration && (!longestMovie || movie.duration > longestMovie.duration)) {
            longestMovie = {
               ratingKey: movie.ratingKey,
               title: movie.title,
               duration: Math.round(movie.duration / 60000),
               thumb: movie.thumb ?? "",
            };
         }
      }
   }

   let totalEpisodes = 0;
   if (showSection) {
      const shows = await getShows(showSection.key);
      for (const show of shows.items) {
         totalEpisodes += show.leafCount ?? 0;
      }
   }

   const totalPlays = history.data.length;

   const daysWatched = new Set(
      history.data.map((i) => {
         const d = new Date(i.stopped * 1000);
         return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
   ).size;

   let topDevice: { name: string; plays: number } | null = null;
   if (env.SHOW_DEVICES) {
      const deviceCounts = new Map<string, number>();
      for (const item of history.data) {
         const dev = item.platform || item.product || "Unknown";
         deviceCounts.set(dev, (deviceCounts.get(dev) ?? 0) + 1);
      }
      let maxPlays = 0;
      for (const [name, plays] of deviceCounts) {
         if (plays > maxPlays) {
            maxPlays = plays;
            topDevice = { name, plays };
         }
      }
   }

   let topLocation: string | null = null;
   if (env.SHOW_LOCATIONS) {
      const ips = new Set<string>();
      for (const item of history.data) {
         if (item.ip_address && item.ip_address !== "127.0.0.1") {
            ips.add(item.ip_address);
         }
      }
      if (ips.size > 0) {
         const firstIp = Array.from(ips)[0];
         try {
            const geo = await getGeoipLookup(firstIp);
            if (geo.country) {
               topLocation = geo.country;
            }
         } catch {
            // ignore
         }
      }
   }

   let topArtist: { title: string; plays: number } | null = null;
   if (env.SHOW_MUSIC) {
      const artistPlays = new Map<string, { title: string; plays: number }>();
      for (const item of history.data) {
         if (item.media_type === "track") {
            const name = item.grandparent_title || item.title;
            const existing = artistPlays.get(name);
            if (existing) {
               existing.plays++;
            } else {
               artistPlays.set(name, { title: name, plays: 1 });
            }
         }
      }
      let maxPlays = 0;
      for (const entry of artistPlays.values()) {
         if (entry.plays > maxPlays) {
            maxPlays = entry.plays;
            topArtist = entry;
         }
      }
   }

   return {
      mostWatched,
      mostRewatched,
      longestMovie,
      totalEpisodes,
      totalPlays,
      daysWithActivity: daysWatched,
      avgPlaysPerDay:
         daysWatched > 0 ? Math.round((totalPlays / daysWatched) * 10) / 10 : 0,
      topDevice,
      topLocation,
      topArtist,
   };
};

export const getDeviceStatsCached = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("deviceStats"), CACHE_TAGS.tautulli);

   const history = await getHistory(2000);
   const platforms = new Map<string, { plays: number; lastUsed: number }>();

   for (const item of history.data) {
      const key = item.platform || item.product || "Unknown";
      const existing = platforms.get(key);
      if (existing) {
         existing.plays++;
         existing.lastUsed = Math.max(existing.lastUsed, item.stopped);
      } else {
         platforms.set(key, { plays: 1, lastUsed: item.stopped });
      }
   }

   return Array.from(platforms.entries())
      .map(([name, stats]) => ({ name, plays: stats.plays, lastUsed: stats.lastUsed }))
      .sort((a, b) => b.plays - a.plays);
};

export const getVideoQualityStatsCached = async () => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("videoQualityStats"), CACHE_TAGS.plex, CACHE_TAGS.tautulli);

   const sections = await getLibrarySections();
   const movieSection = sections.find((s) => s.type === "movie");
   if (!movieSection) return [];

   const info = await getLibraryMediaInfo(movieSection.key, 1000);
   const resolutions = new Map<string, number>();

   const resolutionLabels: Record<string, string> = {
      "4k": "4K",
      "1080": "1080p",
      "720": "720p",
      sd: "SD",
   };

   for (const item of info.data) {
      if (!item.video_resolution) continue;
      const label = resolutionLabels[item.video_resolution] ?? item.video_resolution;
      resolutions.set(label, (resolutions.get(label) ?? 0) + 1);
   }

   return Array.from(resolutions.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
};

export const getAudioFormatStatsCached = async () => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("audioFormatStats"), CACHE_TAGS.plex, CACHE_TAGS.tautulli);

   const sections = await getLibrarySections();
   const movieSection = sections.find((s) => s.type === "movie");
   if (!movieSection) return [];

   const info = await getLibraryMediaInfo(movieSection.key, 1000);
   const codecs = new Map<string, number>();

   const codecLabels: Record<string, string> = {
      "dca-ma": "DTS-HD MA",
      truehd: "TrueHD",
      eac3: "EAC3",
      ac3: "AC3",
      aac: "AAC",
      dca: "DTS",
      flac: "FLAC",
      mpeg3: "MP3",
      opus: "Opus",
   };

   for (const item of info.data) {
      if (!item.audio_codec) continue;
      const label = codecLabels[item.audio_codec] ?? item.audio_codec.toUpperCase();
      codecs.set(label, (codecs.get(label) ?? 0) + 1);
   }

   return Array.from(codecs.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
};

export const getMusicAudioFormatStatsCached = async () => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("musicAudioFormatStats"), CACHE_TAGS.plex);

   const sections = await getLibrarySections();
   const musicSection = sections.find((s) => s.type === "artist");
   if (!musicSection) return [];

   // type=10 is tracks in Plex
   const tracks = await getSectionItems(musicSection.key, 10);
   const codecs = new Map<string, number>();

   const codecLabels: Record<string, string> = {
      flac: "FLAC",
      alac: "ALAC",
      aac: "AAC",
      mp3: "MP3",
      opus: "Opus",
      vorbis: "Vorbis",
      wav: "WAV",
      pcm: "PCM",
      dsd_lsbf_planar: "DSD",
      dca: "DTS",
      wavpack: "WavPack",
      ape: "APE",
   };

   for (const track of tracks) {
      const codec = track.Media?.[0]?.audioCodec;
      if (!codec) continue;
      const label = codecLabels[codec] ?? codec.toUpperCase();
      codecs.set(label, (codecs.get(label) ?? 0) + 1);
   }

   return Array.from(codecs.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
};

export const getMusicGenreDistributionCached = async () => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("musicGenreDistribution"), CACHE_TAGS.plex);

   const sections = await getLibrarySections();
   const musicSection = sections.find((s) => s.type === "artist");
   if (!musicSection) return [];

   const artists = await getArtists(musicSection.key);
   const genreCounts = new Map<string, number>();

   for (const artist of artists.items) {
      if (artist.Genre) {
         for (const genre of artist.Genre) {
            genreCounts.set(genre.tag, (genreCounts.get(genre.tag) ?? 0) + 1);
         }
      }
   }

   return Array.from(genreCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
};

export const getTopArtistsCached = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("topArtists"), CACHE_TAGS.tautulli);

   const history = await getHistory(5000);
   const artistPlays = new Map<string, number>();

   for (const item of history.data) {
      if (item.media_type === "track") {
         const name = item.grandparent_title || item.title;
         artistPlays.set(name, (artistPlays.get(name) ?? 0) + 1);
      }
   }

   return Array.from(artistPlays.entries())
      .map(([name, plays]) => ({ name, plays }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 15);
};

export const getLibrarySizeStatsCached = async () => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("librarySizeStats"), CACHE_TAGS.plex, CACHE_TAGS.tautulli);

   const sections = await getLibrarySections();
   const sizes: Array<{ name: string; type: string; bytes: number; items: number }> = [];

   // Plex type IDs: 1=movie, 4=episode, 10=track
   const typeMap: Record<string, number> = {
      movie: 1,
      show: 4,
      artist: 10,
   };

   for (const section of sections) {
      const plexType = typeMap[section.type];
      if (!plexType) continue;
      if (section.type === "artist" && !env.SHOW_MUSIC) continue;

      const bytes = await getSectionTotalSize(section.key, plexType);
      const info = await getLibraryMediaInfo(section.key);
      sizes.push({
         name: section.title,
         type: section.type,
         bytes,
         items: info.recordsTotal,
      });
   }

   return sizes;
};

export const getLocationStatsCached = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.analytics, CACHE_TAGS.analyticsScope("locationStats"), CACHE_TAGS.tautulli, CACHE_TAGS.geo);

   const history = await getHistory(500);
   const ipCounts = new Map<string, number>();

   for (const item of history.data) {
      if (item.ip_address && item.ip_address !== "127.0.0.1") {
         ipCounts.set(item.ip_address, (ipCounts.get(item.ip_address) ?? 0) + 1);
      }
   }

   const topIps = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

   const results = await Promise.allSettled(
      topIps.map(async ([ip, count]) => {
         const geo = await getGeoipLookup(ip);
         return { location: geo.country || "Unknown", plays: count };
      }),
   );

   const locationMap = new Map<string, number>();
   for (const r of results) {
      if (r.status === "fulfilled") {
         locationMap.set(
            r.value.location,
            (locationMap.get(r.value.location) ?? 0) + r.value.plays,
         );
      }
   }

   return Array.from(locationMap.entries())
      .map(([location, plays]) => ({ location, count: plays }))
      .sort((a, b) => b.count - a.count);
};
