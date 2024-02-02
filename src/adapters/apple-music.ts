import * as config from '~/config/default';

import HttpClient from '~/utils/http-client';
import { logger } from '~/utils/logger';
import { getCheerioDoc } from '~/utils/scraper';
import { responseMatchesQuery } from '~/utils/compare';

import { SpotifyMetadata, SpotifyMetadataType } from '~/parsers/spotify';
import { SpotifyContentLink, SpotifyContentLinkType } from '~/services/search';

export const APPLE_MUSIC_LINK_SELECTOR = 'a[href^="https://music.apple.com/"]';

export async function getAppleMusicLink(query: string, metadata: SpotifyMetadata) {
  const params = new URLSearchParams({
    term: query,
  });

  const url = new URL(config.services.appleMusic.baseUrl);
  url.search = params.toString();

  try {
    const html = await HttpClient.get<string>(url.toString());
    const doc = getCheerioDoc(html);

    const appleMusicDataByType = {
      [SpotifyMetadataType.Song]: {
        href: doc(`div[aria-label="Songs"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .attr('href'),
        title: doc(`div[aria-label="Songs"] ${APPLE_MUSIC_LINK_SELECTOR}`).first().text(),
      },
      [SpotifyMetadataType.Album]: {
        href: doc(`div[aria-label="Albums"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .attr('href'),
        title: doc(`div[aria-label="Albums"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .text(),
      },
      [SpotifyMetadataType.Playlist]: {
        href: doc(`div[aria-label="Playlists"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .attr('href'),
        title: doc(`div[aria-label="Playlists"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .text(),
      },
      [SpotifyMetadataType.Artist]: {
        href: doc(`div[aria-label="Artists"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .attr('href'),
        title: doc(`div[aria-label="Artists"] ${APPLE_MUSIC_LINK_SELECTOR}`)
          .first()
          .text(),
      },
      [SpotifyMetadataType.Podcast]: undefined,
      [SpotifyMetadataType.Show]: undefined,
    };

    const { title, href } = appleMusicDataByType[metadata.type] ?? {};

    if (!responseMatchesQuery(title ?? '', query)) {
      return;
    }

    return {
      type: SpotifyContentLinkType.AppleMusic,
      url: href ?? url,
      isVerified: Boolean(href),
    } as SpotifyContentLink;
  } catch (err) {
    logger.error(`[Apple Music] (${url}) ${err}`);

    return;
  }
}
