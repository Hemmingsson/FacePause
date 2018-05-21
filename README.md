

<h1>
  <br><img src="resources/CWS-dl.png?raw=true" alt="Face Pause" width="100">
  Face Pause
  <br>
</h1>

#### Experimental Chrome Extension - Look Away to Pause Youtube

<p align="center">
  <br>
  <img align="center" src="https://media.giphy.com/media/2sdM8tdDlqZGY7g3bT/giphy.gif" width="430">
  <img align="center" src="https://media.giphy.com/media/lznFhXYLC4gekGsA3x/giphy.gif" width="430">
   <br><br>
</p>





Chrome (v56+) has a new FaceDetector API which basically lets you detect faces in images easily, so what if we could pause the youtube video you are watching when you look away or going to make a sandwich 🍞?


## How to install

You can install Freeze from the [Chrome web store](https://chrome.google.com/webstore/detail/kacdbklgelcjnoejpbafhdelhlnkgpnd)

<a href="https://chrome.google.com/webstore/detail/kacdbklgelcjnoejpbafhdelhlnkgpnd">
    <img src="resources/CWS-dl.png" width="320">
 </a>



## Notice

- 🏴 To get the extension to work you’ll need to enable Chrome Experimental Features here: <br>
`chrome://flags#enable-experimental-web-platform-features`

- 💡If you’re in a dark setting it will probably be a bit buggy, as FaceDetector API is still not great in bad light. 


## Credits
- [Extension Boilerplate](https://github.com/EmailThis/extension-boilerplate)
- [Sentinel.js](https://github.com/muicss/sentineljs)
- Chirag Bhatia’s [faceDetection Demo](https://github.com/chirag64/live-face-detector/)
- Christian for feedback & icon

## Development

### Installation
1. Clone the repository `git clone https://github.com/Hemmingsson/Face-Pause`
2. Run `npm install`
3. Run `npm run build`

##### Load the extension in Chrome
1. Open Chrome browser and navigate to chrome://extensions
2. Select "Developer Mode" and then click "Load unpacked extension..."
3. From the file browser, choose to `Face-Pause/build/chrome`


### Developing
The following tasks can be used when you want to start developing the extension

- `npm run chrome-watch`



