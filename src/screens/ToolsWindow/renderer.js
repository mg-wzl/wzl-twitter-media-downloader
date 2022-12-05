const information = document.getElementById('info');

document.querySelector('#pickFolderButton').addEventListener('click', async () => {
  const folder = await window.on.pickTargetFolderClicked();
  if (folder) {
    document.querySelector('#targetFolder').innerText = folder;
  }
});

document.querySelector('#pickFavesFileButton').addEventListener('click', async () => {
  const favesFile = await window.on.pickFavesFileClicked();
  if (favesFile) {
    document.querySelector('#favesFile').innerText = favesFile;
  }
});

document.querySelector('#clearCookiesButton').addEventListener('click', () => {
  window.on.clearCookiesClicked();
});

document.querySelector('#clearLogButton').addEventListener('click', () => {
  window.on.clearLogClicked();
});

document.querySelector('#openTwitterButton').addEventListener('click', () => {
  window.on.twitterLoginClicked();
});

document.querySelector('#downloadFavesButton').addEventListener('click', () => {
  window.on.downloadFavesClicked();
});
