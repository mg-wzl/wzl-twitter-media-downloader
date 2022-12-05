const parser = require('./parsers/tweetPageParser');
const { getFileExtensionFromUrl } = require('./utils/stringUtils');
const axios = require('axios');

const BASE_URL = 'https://tweetpik.com/api/tweets';

const getGeneralTweetInfo = (tweetData) => {
  return {
    tweetId: tweetData.id,
    userHandle: tweetData.username,
    text: tweetData.text,
    datetime: tweetData.created_at,
  };
};

const getMedia = async (tweetData) => {
  return new Promise(async (resolve, reject) => {
    const mediaArr = [];
    if (tweetData?.media) {
      for (let i = 0; i < tweetData.media?.length; i++) {
        const media = tweetData.media[i];
        if (media?.type === 'photo' && media?.url) {
          mediaArr.push({
            url: media?.url,
            extension: getFileExtensionFromUrl(media.url),
          });
        } else if (media?.type === 'animated_gif' || media?.type === 'video') {
          const videoResult = await axios(`${BASE_URL}/${tweetData.id}/video`);
          console.log('VIDEO RESULT', videoResult.data);
          if (videoResult.data) {
            const variants = videoResult.data.variants;
            if (variants?.length) {
              let biggestBitrate = 0;
              let biggestVariant;
              for (const variant of variants) {
                if (variant.bitrate > biggestBitrate) {
                  biggestBitrate = variant.bitrate;
                  biggestVariant = variant;
                }
              }
              if (biggestVariant?.url) {
                mediaArr.push({
                  url: biggestVariant?.url,
                  extension: getFileExtensionFromUrl(biggestVariant.url),
                });
              }
            }
          }
        }
      }
    }
    resolve(mediaArr);
  });
};

const combineTweet = async (tweetData) => {
  const generalInfo = getGeneralTweetInfo(tweetData);
  const media = await getMedia(tweetData);
  return { ...generalInfo, mediaFiles: media };
};

const fetchTweetContent = (tweetId) => {
  return new Promise((resolve, reject) => {
    axios(`${BASE_URL}/${tweetId}`)
      .then(async (res) => {
        console.log('AXIOS res', res.data);
        const mainTweet = await combineTweet(res?.data);
        const content = [mainTweet];
        if (res.data?.quote?.media) {
          const quoteTweet = await combineTweet(res.data?.quote);
          console.log('QUOTE TWEET:', quoteTweet);
          content.push(quoteTweet);
        }
        resolve(content);
      })
      .catch((e) => {
        reject(e);
      });
  });
};

module.exports = {
  fetchTweetContent,
};
