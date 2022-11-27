const path = require('path');
const os = require('os');

let targetFolderPath = path.join(os.homedir(), 'Documents', 'scraping', 'scrape01');

const setTargetFolder = (newTargetFolder) => {
  targetFolderPath = newTargetFolder;
};

const getTargetFolder = () => targetFolderPath;

module.exports = { setTargetFolder, getTargetFolder };
