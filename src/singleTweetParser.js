const { parseTweetUrl } = require('./parser');

const youtubeRegex = /(youtube.com|youtu.be)/i;
const quotedTweetXpath = '//time//ancestor::div[@aria-labelledby]';
const quotedTweetImages =
  '//*[@data-testid="tweet"]//time//ancestor::div[@aria-labelledby]//*[@data-testid="tweetPhoto"]//img';

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

const parseUserHandleAndAvatar = (tweetContainer) => {
  const avatarContainer = tweetContainer.querySelector('[data-testid*="UserAvatar-Container"]');
  const profileUrl = avatarContainer?.querySelector('a')?.href || '';
  const avatarSmall = avatarContainer?.querySelector('img')?.src || '';

  const userHandle = profileUrl.replace('/', '');
  const avatar = avatarSmall.replace('x96', '400x400');

  return { userHandle, avatar };
};

const parseUrlAndDatetime = (tweetContainer) => {
  const timeElement = tweetContainer.querySelector('time');
  const dateTime = timeElement?.dateTime;
  const url = timeElement?.closest('a')?.href || '';
  const { tweetId } = parseTweetUrl(url);

  return { dateTime, url, tweetId };
};

const parseImages = (tweetContainer) => {
  const imageElements = [...tweetContainer.querySelectorAll('[data-testid="tweetPhoto"] img')];
  if (!imageElements?.length) {
    return null;
  }
  const images = imageElements.map((img) => img.src);

  return images;
};

const parseVideo = (tweetContainer) => {
  const videoElement = tweetContainer.querySelector('[data-testid="videoPlayer"] video');
  if (!videoElement) {
    return null;
  }

  return { src: videoElement.src, type: videoElement.type };
};

const parseTweet = (tweetContainer) => {
  const images = parseImages(tweetContainer);
  const video = parseVideo(tweetContainer);
  let card;
  let tweetText;
  let type = TYPE_MEDIA;
  if (!(images || video)) {
    // we don't need tweets with no media
    // check if the tweet has a youtube link in it
    card = parseCard(tweetContainer);
    tweetText = parseText(tweetContainer);
    if (!card?.hasYoutube && !tweetText?.hasYoutube) {
      return null;
    }
    type = TYPE_YOUTUBE;
  }

  const { url, tweetId, dateTime } = parseUrlAndDatetime(tweetContainer);
  const { userHandle, avatar } = parseUserHandleAndAvatar(tweetContainer);

  let result = { type, userHandle, tweetId, url, dateTime, avatar };
  if (type === TYPE_MEDIA) {
    return { ...result, images, video };
  } else if (type === TYPE_YOUTUBE) {
    return { ...result, text: tweetText.text, card };
  }
};

module.exports = { parseTweet };
