const urlFromTweetIdAndUserHandle = (tweetId, userHandle) => {
  if (!tweetId) {
    return 'err: no tweetId';
  }
  if (!userHandle) {
    return `https://twitter.com/i/web/status/${tweetId}`;
  }
  return `https://twitter.com/${userHandle}/status/${tweetId}`;
};

const filenameFromTwitterUrl = (urlString) => {
  if (!urlString) {
    return null;
  }
  const url = new URL(urlString);
  if (!url) {
    return null;
  }
  let filename = '';
  const pathParts = url?.pathname?.split('/');
  if (pathParts?.length > 1) {
    filename += pathParts.slice(1).join('_');
  }
  if (url.searchParams) {
    url.searchParams.forEach((v, k) => (filename += `-${k}_${v.replaceAll(/\W/g, '_')}`));
  }
  return filename;
};

const scrapedFileNameFromUrl = (urlString) => {
  const now = new Date();
  const dateString = `${now.getFullYear()}${
    now.getMonth() + 1
  }${now.getDate()}-${now.getHours()}${now.getMinutes()}`;
  return `__tweets_${filenameFromTwitterUrl(urlString)}_${dateString}.json`;
};

const getFileExtensionFromUrl = (url) => {
  let extension = '';
  const fileUrl = new URL(url);
  const pathParts = fileUrl?.pathname?.split('/');
  if (pathParts?.length > 0) {
    const filename = pathParts[pathParts.length - 1];
    const dotIndex = filename.lastIndexOf('.');
    extension = dotIndex > -1 ? filename?.slice(dotIndex + 1) : '';
  }
  if (!extension) {
    extension = fileUrl.searchParams.get('format') || '';
  }
  return extension;
};

const parseTweetUrl = (tweetUrl) => {
  if (!tweetUrl) {
    return null;
  }
  const url = new URL(tweetUrl);
  const pathParts = url?.pathname.split('/');
  let tweetId = '',
    userHandle = '';
  /* tweet ID */
  if (pathParts?.length > 1) {
    tweetId = pathParts[pathParts.length - 1];
  }
  /* user handle */
  if (!tweetUrl.includes('i/web')) {
    userHandle = pathParts[1];
  }
  return { tweetId, userHandle };
};

module.exports = {
  scrapedFileNameFromUrl,
  getFileExtensionFromUrl,
  parseTweetUrl,
  urlFromTweetIdAndUserHandle,
};
