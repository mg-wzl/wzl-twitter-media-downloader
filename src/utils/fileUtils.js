const fs = require('fs');
const path = require('path');

const readOfficialLikesFile = (path) => {
  let rawdata = fs.readFileSync(path);
  let favesList = [];
  try {
    const favesObj = JSON.parse(rawdata);
    favesList = favesObj.map((v) => v?.like?.expandedUrl);
  } catch (e) {
    console.log('Not a valid JSON file.', e);
  }
  // console.log('Faves >>>>');
  // console.log(favesList);
  // console.log('<<<< Faves');

  return favesList;
};

// finished.js will contain an array of tweet ids that are already downloaded in its directory
const readFinishedDownloadsFile = (targetFolder) => {
  const finishedPath = path.join(targetFolder, 'finished.js');
  let finishedIds = [];
  try {
    finishedIds = fs.readFileSync(finishedPath).toString().split('\n');
    console.log('finished Ids count:', finishedIds?.length);
  } catch (e) {
    console.log('Could not read finished.js:', e);
  }
  return finishedIds;
};

const rewriteFinishedDownloadsFile = (targetFolder, finishedIds) => {
  const finishedPath = path.join(targetFolder, 'finished.js');
  try {
    fs.writeFileSync(finishedPath, finishedIds?.join('\n'));
    console.log('finished Ids file updated. Count:', finishedIds?.length);
  } catch (e) {
    console.log('Could not write finished.js:', e);
  }
  return finishedIds;
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

module.exports = {
  readOfficialLikesFile,
  readFinishedDownloadsFile,
  rewriteFinishedDownloadsFile,
  writeJsonFile,
};
