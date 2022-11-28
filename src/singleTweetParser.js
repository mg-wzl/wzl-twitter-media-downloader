const { parseTweetUrl } = require('./parser');

const youtubeRegex = /(youtube.com|youtu.be)/i;

const TYPE_MEDIA = 'media';
const TYPE_YOUTUBE = 'youtube';

const parseCard = (tweetContainer) => {
  const card = tweetContainer.querySelector('[data-testid="card.wrapper"]');
  const cardA = card?.querySelectorAll('a')[1];
  if (!card) {
    return null;
  }
  const text = card.textContent || '';
  const url = cardA?.href || '';
  const hasYoutube = youtubeRegex.test(url) || youtubeRegex.test(text);
  return { text, url, hasYoutube };
};

const parseText = (tweetContainer) => {
  const text = tweetContainer.querySelector('[data-testid="tweetText"]')?.textContent || '';
  const hasYoutube = youtubeRegex.test(text);
  return { text, hasYoutube };
};

const parseUserAvatar = (tweetContainer) => {
  const avatarContainer = tweetContainer.querySelector('[data-testid*="UserAvatar-Container"]');
  const avatarSmall = avatarContainer?.querySelector('img')?.src || '';
  const avatar = avatarSmall?.replace(/(_x96|_normal)/, '_400x400');

  return { avatar };
};

const parseUrlAndDatetime = (tweetContainer) => {
  const timeElement = tweetContainer.querySelector('time');
  const dateTime = timeElement?.dateTime;
  const url = timeElement?.closest('a')?.href || '';

  const parseResults = parseTweetUrl(url);
  const { tweetId, userHandle } = parseResults || { tweetId: null, userHandle: null };

  return { dateTime, url, tweetId, userHandle };
};

const parseQuotedTweetUrlAndDatetime = (tweetContainer) => {
  const timeElement = tweetContainer.querySelector('time');
  const dateTime = timeElement?.dateTime;
  const photoUrl = tweetContainer.querySelector('a')?.href;
  let url = null;
  if (photoUrl) {
    const tmpUrl = new URL(photoUrl);
    const tmpUrlParts = tmpUrl?.pathname?.split('/');
    if (tmpUrlParts?.length > 3) {
      url = tmpUrl.origin + tmpUrlParts.slice(0, 4).join('/');
    }
  }
  const parseResults = parseTweetUrl(url);
  const { tweetId, userHandle } = parseResults || { tweetId: null, userHandle: null };

  return { dateTime, url, tweetId, userHandle };
};

const parseImages = (tweetContainer, quoted) => {
  const imageElements = [
    ...tweetContainer.querySelectorAll(
      !quoted ? '[data-testid="tweetPhoto"] img' : '[data-testid="tweetPhoto"] img'
    ),
  ];
  if (!imageElements?.length) {
    return null;
  }
  const images = imageElements.map((img) => {
    const urlString = img.src;
    let urlLarge;
    if (urlString) {
      urlLarge = new URL(urlString);
      urlLarge.searchParams.set('name', 'large');
    }
    return urlLarge ? urlLarge.toString() : urlString;
  });

  return images;
};

const parseVideo = (tweetContainer, quoted) => {
  const videoElement = tweetContainer.querySelector(
    !quoted ? '[data-testid="videoPlayer"] video' : '[data-testid="videoPlayer"] video'
  );
  if (!videoElement) {
    return null;
  }

  return { src: videoElement.src, type: videoElement.type };
};

const parseTweet = (tweetContainer, mediaContainer, quoted) => {
  let images = null,
    video = null,
    card = null;
  let type = TYPE_MEDIA;
  if (mediaContainer) {
    images = parseImages(mediaContainer, quoted);
    video = parseVideo(mediaContainer, quoted);
    card = parseCard(mediaContainer);
  }
  let tweetText;
  if (!(images || video)) {
    // we don't need tweets with no media
    // check if the tweet has a youtube link in it
    tweetText = parseText(tweetContainer);
    if (!card?.hasYoutube && !tweetText?.hasYoutube) {
      return null;
    }
    type = TYPE_YOUTUBE;
  }

  const { url, tweetId, dateTime, userHandle } = !quoted
    ? parseUrlAndDatetime(tweetContainer)
    : parseQuotedTweetUrlAndDatetime(tweetContainer);
  const { avatar } = parseUserAvatar(tweetContainer);

  let result = { type, userHandle, tweetId, url, dateTime, avatar };
  if (quoted) {
    result = { ...result, quoted };
  }
  if (type === TYPE_MEDIA) {
    return { ...result, images, video };
  } else if (type === TYPE_YOUTUBE) {
    return { ...result, text: tweetText.text, card };
  }
};

const parseComplexTweet = (tweetContainer) => {
  if (!tweetContainer) {
    return null;
  }
  let mainTweetParsed;
  let quotedTweetParsed;
  const hasQuotedTweet = tweetContainer.querySelector('div[aria-labelledby][id] time');
  if (!hasQuotedTweet) {
    mainTweetParsed = parseTweet(tweetContainer, tweetContainer, false);
  } else {
    const mediaContainers = [...tweetContainer.querySelectorAll('div[aria-labelledby] > div')];
    if (mediaContainers?.length === 1) {
      // this is quoted tweet container
      quotedTweetParsed = parseTweet(mediaContainers[0], mediaContainers[0], true);
      // main tweet can contain links to youtube. Don't look for images or videos
      mainTweetParsed = parseTweet(tweetContainer, null, false);
    } else if (mediaContainers?.length === 2) {
      // both main and quoted tweets have media
      mainTweetParsed = parseTweet(tweetContainer, mediaContainers[0], false);
      quotedTweetParsed = parseTweet(mediaContainers[1], mediaContainers[1], true);
    }
  }

  return [mainTweetParsed, quotedTweetParsed].filter((v) => !!v);
};

module.exports = { parseTweet, parseComplexTweet };
