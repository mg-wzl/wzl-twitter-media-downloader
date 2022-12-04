const path = require('path');
const os = require('os');

let targetFolderPath = path.join(os.homedir(), 'Documents', 'scraping', 'scrape01');
let favesFilePath = path.join(os.homedir(), 'Documents', 'scraping', 'like.js'); // TODO: move into file manager

const setTargetFolder = (newTargetFolder) => {
  targetFolderPath = newTargetFolder;
};

const getTargetFolder = () => targetFolderPath;

const setFavesFilePath = (filePath) => {
  favesFilePath = filePath;
};

const getFavesFilePath = () => favesFilePath;

module.exports = { setTargetFolder, getTargetFolder, setFavesFilePath, getFavesFilePath };
