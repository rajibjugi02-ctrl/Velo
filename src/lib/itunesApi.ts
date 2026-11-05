import { Song } from '@/types/velo';

export const TRENDING_CATALOG_SONGS: Song[] = [
  {
    id: 'itunes-starboy',
    title: 'Starboy (feat. Daft Punk)',
    artist: 'The Weeknd',
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/400x400bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a',
    duration: 30,
    startTime: 0,
    endTime: 30,
  },
  {
    id: 'itunes-blinding-lights',
    title: 'Blinding Lights (Remix)',
    artist: 'The Weeknd & ROSALÍA',
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/400x400bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
    duration: 30,
    startTime: 0,
    endTime: 30,
  },
  {
    id: 'itunes-as-it-was',
    title: 'As It Was',
    artist: 'Harry Styles',
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/400x400bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a',
    duration: 30,
    startTime: 0,
    endTime: 30,
  },
  {
    id: 'itunes-levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/400x400bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a',
    duration: 30,
    startTime: 0,
    endTime: 30,
  },
  {
    id: 'itunes-golden-hour',
    title: 'golden hour',
    artist: 'JVKE',
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8d/1a/7b/8d1a7b44-316f-7c7f-4380-935673fb697a/5056167175650.jpg/400x400bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/30/02/8c/30028c8a-a125-5466-bcc6-27a83b1c0135/mzaf_16911571635366913039.plus.aac.p.m4a',
    duration: 30,
    startTime: 0,
    endTime: 30,
  },
  {
    id: 'itunes-midnight-city',
    title: 'Midnight City',
    artist: 'M83',
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/cb/7b/a9/cb7ba903-b5f1-cc21-90db-7a81b7aa0997/724596951057.jpg/400x400bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/24/09/79/2409794c-3d5d-af26-580e-7dc00ee4f207/mzaf_369629549966021675.plus.aac.p.m4a',
    duration: 30,
    startTime: 0,
    endTime: 30,
  },
];

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || query.trim().length === 0) {
    return TRENDING_CATALOG_SONGS;
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&entity=song&limit=15`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return TRENDING_CATALOG_SONGS.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      );
    }

    return data.results.map((item: any) => ({
      id: String(item.trackId),
      title: item.trackName || 'Unknown Title',
      artist: item.artistName || 'Unknown Artist',
      albumArt: item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '400x400bb')
        : undefined,
      previewUrl: item.previewUrl,
      duration: 30,
      startTime: 0,
      endTime: 30,
    }));
  } catch {
    // Fallback search in trending catalogue
    return TRENDING_CATALOG_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase())
    );
  }
}

