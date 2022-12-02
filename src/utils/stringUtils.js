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
  return `tweets_${filenameFromTwitterUrl(urlString)}_${dateString}.json`;
};

module.exports = {
  scrapedFileNameFromUrl,
};
