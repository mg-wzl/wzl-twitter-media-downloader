const fs = require('fs');
const path = require('path');

const FINISHED_FILENAME = '___finished.json';
const FAILED_FILENAME = '___failed.json';

const FileType = {
  UNKNOWN: 'unknown',
  OFFICIAL: 'official',
  PARSED: 'parsed',
};

const readTweetsListFile = (path) => {
  let rawdata = fs.readFileSync(path);
  let favesList = [];
  let fileType = FileType.UNKNOWN;
  try {
    const favesObj = JSON.parse(rawdata);

    // detect file type
    if (!!favesObj?.[0]?.like && !!favesObj?.[0].like.expandedUrl) {
      fileType = FileType.OFFICIAL;
    } else if (!!favesObj?.[0]?.mediaType && !!favesObj?.[0]?.url) {
      fileType = FileType.PARSED;
    }

    favesList = favesObj.map((v) => v?.like?.expandedUrl);
  } catch (e) {
    console.log('Not a valid JSON file.', e);
  }

  return { favesList, fileType };
};

const writeJsonFile = (data, targetFolder, fileName) => {
  if (!data || !targetFolder || !fileName) {
    console.log('writeJsonFile: Incorrect parameters', { data, targetFolder, fileName });
  }
  const filePath = path.join(targetFolder, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Data file created:', filePath);
  } catch (e) {
    console.log(`Error when creating file: ${filePath} :`, e);
  }
};

const writeStringArrayFile = (targetFolder, filename, stringArr) => {
  const filePath = path.join(targetFolder, filename);
  try {
    fs.writeFileSync(filePath, stringArr?.join('\n'), {});
    console.log(`Written data to ${filename}. Lines: ${stringArr?.length}`);
  } catch (e) {
    console.log(`Could not write ${filename}:`, e);
  }
};

const readStringArrayFile = (targetFolder, filename) => {
  const filePath = path.join(targetFolder, filename);
  let linesArr = [];
  try {
    linesArr = fs.readFileSync(filePath).toString().split('\n');
    console.log(`Read ${linesArr?.length} lines from ${filename}.`);
  } catch (e) {
    console.log(`Could not read ${filename}:`, e);
  }
  return linesArr;
};

const appendStringArrayToFile = (targetFolder, filename, stringArr) => {
  const filePath = path.join(targetFolder, filename);
  try {
    fs.appendFileSync(filePath, '\n' + stringArr?.join('\n'), {});
    console.log(`Appended ${stringArr?.length} to ${filename} `);
  } catch (e) {
    console.log(`Could not append ${filename}:`, e);
  }
  return stringArr;
};

// finished.json will contain an array of tweet ids that are already downloaded in its directory
const readFinishedDownloadsFile = (targetFolder) => {
  return readStringArrayFile(targetFolder, FINISHED_FILENAME);
};

const rewriteFinishedDownloadsFile = (targetFolder, finishedIds) => {
  return writeStringArrayFile(targetFolder, FINISHED_FILENAME, finishedIds);
};

const appendFailedDownloadsFile = (targetFolder, failedUrls) => {
  const fromFile = readStringArrayFile(targetFolder, FAILED_FILENAME);
  const filteredUrls = failedUrls?.filter((url) => !fromFile.includes(url));
  if (filteredUrls?.length) {
    appendStringArrayToFile(targetFolder, FAILED_FILENAME, failedUrls);
  }
};

module.exports = {
  readTweetsListFile,
  readFinishedDownloadsFile,
  rewriteFinishedDownloadsFile,
  writeJsonFile,
  appendFailedDownloadsFile,
  FileType,
};
