# TinyTwitterScraper

Small Electron app which helps you download your favourite images from Twitter.
Everything runs locally in separate instance of Electron (browser-based desktop application) - no personal info gets sent anywhere.

# Runnining from sources

1. Install Node.JS (always reccommended to use [nvm](https://github.com/nvm-sh/nvm)), check it's installed correctly:
```
node -v
npm -v
```

2. Install [Yarn](https://classic.yarnpkg.com/en/docs/install):
```
npm install --global yarn
```

3. Install dependencies:
```
yarn install
```

4. Start the app:
```
yarn start
```


# Building from sources

1. Install all required dependencies for [Electron Packager](https://github.com/electron/electron-packager) for your target platforms (e.g. if you're building for Windows on Mac/Linux)

2. Install dependencies:
```
yarn install
```

3. Run one of the following scripts, depending on what platform you want to build for (`yarn build` - for all platforms). 
```
yarn build
yarn build:mac
yarn build:win
yarn build:linux
```
Edit "out" parameter (in `package.json`) for different output directory. See more options in [Electron Packager](https://github.com/electron/electron-packager) documentation