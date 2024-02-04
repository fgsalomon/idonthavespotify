import {
  beforeAll,
  afterEach,
  afterAll,
  describe,
  expect,
  it,
  spyOn,
  jest,
} from 'bun:test';

import axios from 'axios';
import Redis from 'ioredis';
import AxiosMockAdapter from 'axios-mock-adapter';

import { app } from '~/index';

import { JSONRequest } from '../../utils/request';
import {
  SEARCH_ENDPOINT,
  getAppleMusicSearchLink,
  getYoutubeSearchLink,
} from '../../utils/shared';

import youtubePodcastResponseMock from '../../fixtures/youtube/youtubePodcastResponseMock.json';

const [spotifyPodcastHeadResponseMock, appleMusicPodcastResponseMock] = await Promise.all(
  [
    Bun.file('tests/fixtures/spotify/spotifyPodcastHeadResponseMock.html').text(),
    Bun.file('tests/fixtures/apple-music/appleMusicPodcastResponseMock.html').text(),
  ]
);

describe('GET /search - Podcast Episode', () => {
  let mock: AxiosMockAdapter;
  let redisSetMock: jest.Mock;
  let redisGetMock: jest.Mock;

  beforeAll(() => {
    mock = new AxiosMockAdapter(axios);

    redisSetMock = spyOn(Redis.prototype, 'set');
    redisGetMock = spyOn(Redis.prototype, 'get');
  });

  afterEach(() => {
    redisGetMock.mockReset();
    redisSetMock.mockReset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should return 200', async () => {
    const spotifyLink = 'https://open.spotify.com/episode/43TCrgmP23qkLcAXZQN8qT';
    const query =
      'The%20End%20of%20Twitter%20as%20We%20Know%20It%20Waveform%3A%20The%20MKBHD%20Podcast';

    const appleMusicSearchLink = getAppleMusicSearchLink(query);
    const youtubeSearchLink = getYoutubeSearchLink(query, 'video');

    const request = JSONRequest(SEARCH_ENDPOINT, { spotifyLink });

    mock.onGet(spotifyLink).reply(200, spotifyPodcastHeadResponseMock);
    mock.onGet(appleMusicSearchLink).reply(200, appleMusicPodcastResponseMock);
    mock.onGet(youtubeSearchLink).reply(200, youtubePodcastResponseMock);

    redisGetMock.mockResolvedValue(0);
    redisSetMock.mockResolvedValue('');

    const response = await app.handle(request).then(res => res.json());

    expect(response).toEqual({
      id: '43TCrgmP23qkLcAXZQN8qT',
      type: 'music.episode',
      title: 'The End of Twitter as We Know It',
      description:
        'Listen to this episode from Waveform: The MKBHD Podcast on Spotify. So much happened this week! Not only did Twitter get renamed but Samsung Unpacked happened as well. First, Marques, Andrew, and David talk about base model pricing before talking all about Twitter getting renamed to X. Then they give their first impressions on the new Samsung products before we close it out with some trivia and tech show-and-tell too. Enjoy!  Links: Linus Base Models video: https://bit.ly/lttstartingprice Apple Insider Action Button article: https://bit.ly/appleinsiderrumors Lex Friedman interview with Zuck: https://bit.ly/lexvsmark  Shop products mentioned:  Google Pixel Fold at https://geni.us/zhOE5oh  Samsung Galaxy Z Fold 5 at https://geni.us/ofBYJ6J  Samsung Galaxy Z Flip 5 at https://geni.us/X7vim  Samsung Galaxy Tab S9 at https://geni.us/bBm1  Samsung Galaxy Watch 6 at https://geni.us/gOAk  Shop the merch: https://shop.mkbhd.com  Threads: Waveform: https://www.threads.net/@waveformpodcast Marques: https://www.threads.net/@mkbhd Andrew: https://www.threads.net/@andrew_manganelli David Imel: https://www.threads.net/@davidimel Adam: https:https://www.threads.net/@parmesanpapi17 Ellis: https://twitter.com/EllisRovin  Twitter: https://twitter.com/WVFRM  TikTok:  https://www.tiktok.com/@waveformpodcast  Join the Discord: https://discord.gg/mkbhd  Music by 20syl: https://bit.ly/2S53xlC  Waveform is part of the Vox Media Podcast Network. Learn more about your ad choices. Visit podcastchoices.com/adchoices',
      image: 'https://i.scdn.co/image/ab6765630000ba8aa05ac56dbc44378f45ef693a',
      audio:
        'https://podz-content.spotifycdn.com/audio/clips/0Dijh26Vc2UoFrsXfkACQ8/clip_2900584_2965529.mp3',
      source: 'https://open.spotify.com/episode/43TCrgmP23qkLcAXZQN8qT',
      links: [
        {
          type: 'youTube',
          url: 'https://www.youtube.com/watch?v=0atwuUWhKWs',
          isVerified: true,
        },
        {
          type: 'soundCloud',
          url: 'https://soundcloud.com/search/sounds?q=The%20End%20of%20Twitter%20as%20We%20Know%20It%20Waveform%3A%20The%20MKBHD%20Podcast',
        },
        {
          type: 'tidal',
          url: 'https://listen.tidal.com/search?q=The%20End%20of%20Twitter%20as%20We%20Know%20It%20Waveform%3A%20The%20MKBHD%20Podcast',
        },
      ],
    });

    expect(redisGetMock).toHaveBeenCalledTimes(2);
    expect(redisSetMock).toHaveBeenCalledTimes(2);
  });
});