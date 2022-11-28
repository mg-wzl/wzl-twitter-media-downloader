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
  console.log('parseCard link container', cardA);
  const text = card.textContent || '';
  const url = cardA?.href || '';
  const hasYoutube = youtubeRegex.test(url) || youtubeRegex.test(text);
  console.log('parseCard result', { text, url, hasYoutube });
  return { text, url, hasYoutube };
};

const parseText = (tweetContainer) => {
  const text = tweetContainer.querySelector('[data-testid="tweetText"]')?.textContent || '';
  const hasYoutube = youtubeRegex.test(text);
  return { text, hasYoutube };
};

const parseUserHAvatar = (tweetContainer) => {
  const avatarContainer = tweetContainer.querySelector('[data-testid*="UserAvatar-Container"]');
  const profileUrl = avatarContainer?.querySelector('a')?.href || '';
  const avatarSmall = avatarContainer?.querySelector('img')?.src || '';

  const avatar = avatarSmall.replace('x96', '400x400');

  return { avatar };
};

const parseUrlAndDatetime = (tweetContainer) => {
  console.log('parseUrlAndDatetime', tweetContainer);
  const timeElement = tweetContainer.querySelector('time');
  const dateTime = timeElement?.dateTime;
  const url = timeElement?.closest('a')?.href || '';

  const parseResults = parseTweetUrl(url);
  const { tweetId, userHandle } = parseResults || { tweetId: null, userHandle: null };

  return { dateTime, url, tweetId, userHandle };
};

const parseQuotedTweetUrlAndDatetime = (tweetContainer) => {
  console.log('parseQuotedTweetUrlAndDatetime', tweetContainer);
  const timeElement = tweetContainer.querySelector('time');
  const dateTime = timeElement?.dateTime;
  const photoUrl = tweetContainer.querySelector('a')?.href;
  console.log({ photoUrl });
  let url = null;
  if (photoUrl) {
    const tmpUrl = new URL(photoUrl);
    const tmpUrlParts = tmpUrl?.pathname?.split('/');
    console.log({ tmpUrlParts });
    if (tmpUrlParts?.length > 3) {
      url = tmpUrl.origin + tmpUrlParts.slice(0, 4).join('/');
      console.log({ url });
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
  const images = imageElements.map((img) => img.src);

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
  const images = parseImages(mediaContainer, quoted);
  const video = parseVideo(mediaContainer, quoted);
  let card;
  let tweetText;
  let type = TYPE_MEDIA;
  if (!(images || video)) {
    // we don't need tweets with no media
    // check if the tweet has a youtube link in it
    card = parseCard(mediaContainer);
    tweetText = parseText(tweetContainer);
    if (!card?.hasYoutube && !tweetText?.hasYoutube) {
      return null;
    }
    type = TYPE_YOUTUBE;
  }

  const { url, tweetId, dateTime, userHandle } = !quoted
    ? parseUrlAndDatetime(tweetContainer)
    : parseQuotedTweetUrlAndDatetime(tweetContainer);
  const { avatar } = parseUserHAvatar(tweetContainer);

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
  const mediaContainers = [...tweetContainer.querySelectorAll('div[aria-labelledby] > div')];
  let mainTweetParsed;
  let quotedTweetParsed;
  if (mediaContainers?.length === 1) {
    // can contain either main tweet with media or plain-text main tweet and quoted tweet
    if (mediaContainers[0]?.querySelector('time')) {
      // this is quoted tweet container
      quotedTweetParsed = parseTweet(mediaContainers[0], mediaContainers[0], true);
      // not parsing main tweet in this case
    } else {
      // there is only main tweet
      mainTweetParsed = parseTweet(tweetContainer, mediaContainers[0], false);
    }
  } else if (mediaContainers?.length === 2) {
    // both main and quoted tweets have media
    mainTweetParsed = parseTweet(tweetContainer, mediaContainers[0], false);
    quotedTweetParsed = parseTweet(mediaContainers[1], mediaContainers[1], true);
  }
  return [mainTweetParsed, quotedTweetParsed].filter((v) => !!v);
};

module.exports = { parseTweet, parseComplexTweet };