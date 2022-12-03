const getMainTweetContainerXpath = (tweetId) => {
  return `//a[contains(@href,"status/${tweetId}")]//ancestor::div[@data-testid="cellInnerDiv"]`;
};

const getMainTweetImageXPath = (tweetId) =>
  `${getMainTweetContainerXpath(tweetId)}//descendant::div[@data-testid="tweetPhoto"]/img`;

const getTweetInfo = (tweetDocument, tweetUrl) => {
  console.log('getTweetInfo:', tweetUrl);
  // there are two types of twee urls: with and without user names:
  // https://twitter.com/userHandle/status/123123123123123
  // https://twitter.com/i/web/status/123123123123123 <- can't use this to parse user handle, obviously
  let userHandle = '',
    tweetId = '';
  if (!tweetUrl) {
    return null;
  }
  const url = new URL(tweetUrl);
  const pathParts = url?.pathname.split('/');
  /* tweet ID */
  if (pathParts?.length > 1) {
    tweetId = pathParts[pathParts.length - 1];
  }
  /* user handle */
  if (!tweetUrl.includes('i/web')) {
    console.log('path parts:', pathParts);
    userHandle = pathParts[1];
  } else {
    // TODO: we can't use given link to parse user handle -> get profile link from the page
    const profileLinkXpath = `${getMainTweetContainerXpath(
      tweetId
    )}//article[@data-testid="tweet"]//div[@data-testid="User-Names"]//a`;
    const userProfileLink = tweetDocument.evaluate(
      profileLinkXpath,
      tweetDocument,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )?.singleNodeValue?.href;
    console.log('parsed profile link', userProfileLink);
    const profilePathParts = new URL(userProfileLink).pathname.split('/');
    if (profilePathParts.length > 0) {
      userHandle = profilePathParts[profilePathParts.length - 1];
    }
  }
  /* datetime */
  const timeXpath = `${getMainTweetContainerXpath(tweetId)}//time`;
  const datetime = tweetDocument.evaluate(
    timeXpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue.dateTime;
  console.log(datetime);

  return { userHandle, tweetId, datetime };
};

const getImageUrls = (tweetDocument, tweetId, userHandle) => {
  if (!tweetDocument) {
    return [];
  }
  const mainTweetImageXPath = `${getMainTweetImageXPath(tweetId)}`;
  const mainTweetImageXPathScreened = mainTweetImageXPath.replaceAll("'", "\\'");
  console.log(mainTweetImageXPathScreened);
  const result = tweetDocument.evaluate(
    mainTweetImageXPathScreened,
    tweetDocument,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  console.log('SNAPSHOT RESULT', result);
  var linksArray = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    linksArray.push(result.snapshotItem(i)?.src);
  }
  const urlsSmall = linksArray;
  console.log('urlsSmall', urlsSmall);
  const urlsLarge = urlsSmall.map((value) => {
    const url = new URL(value);
    url.searchParams.set('name', 'large');
    const pathParts = url.pathname.split('/');
    const origName = pathParts?.length > 0 ? pathParts[pathParts.length - 1] : '';

    return {
      url: url.toString(),
      extension: url.searchParams.get('format'),
      origName,
    };
  });

  return urlsLarge;
};

const parseTweetWithDOM = (tweetPageDocument, link) => {
  console.log('parseTweetWithDOM', { tweetDomHtml: !!tweetPageDocument, link });
  const document = tweetPageDocument;
  console.log('parseTweet document', document);
  const tweetInfo = getTweetInfo(document, link);
  console.log('Tweet Info parsed:', tweetInfo);
  let images;
  if (tweetInfo?.userHandle) {
    console.log('getImageUrls');
    images = getImageUrls(tweetPageDocument, tweetInfo.tweetId, tweetInfo.userHandle);
  }
  return { ...tweetInfo, images };
};

// not reliable
const isTweetLoaded = (document) => {
  const selectorTweetButton = 'div[data-testid="tweetButtonInline"]';
  const selectorCommentsRestricted = 'div[data-testid="thumbnail"]';
  const selectorAvatar = 'div[data-testid="Tweet-User-Avatar"]';

  const selectorTweetText = 'div[data-testid="tweetText"]';
  const selectorTweetPhoto = 'div[data-testid="tweetPhoto"]';
  return (
    document.querySelector(selectorAvatar) &&
    (document.querySelector(selectorTweetButton) ||
      document.querySelector(selectorCommentsRestricted)) &&
    (document.querySelector(selectorTweetText) || document.querySelector(selectorTweetPhoto))
  ); // triple checking it's actually loaded
};

const isTweetImageLoaded = (document, tweetId) => {
  const mainTweetImageXPath = `${getMainTweetImageXPath(tweetId)}`;
  console.log('isTweetImageLoaded', mainTweetImageXPath);
  const result = document.evaluate(
    mainTweetImageXPath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
  return !!result;
};

const isSessionBlocked = (document) => {
  const interstitialGraphic = 'div[data-testid="interstitialGraphic"]'; // this appeared when user suspended my session for acting like a bot
  return document.querySelector(interstitialGraphic);
};

const isProgressCircleVisible = (document) => {
  return !!document.querySelector('div[role="progressbar"] circle');
};

module.exports = {
  parseTweetWithDOM,
  isTweetLoaded,
  isTweetImageLoaded,
  isSessionBlocked,
  isProgressCircleVisible,
};
