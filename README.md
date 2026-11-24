

<h1>
 <img src="resources/FacePause.png?raw=true" alt="Face Pause">
  <br>
   FacePause 
</h1>


#### Look Away to Pause Youtube - Experimental Chrome Extension


FacePause uses the experimental native `FaceDetector` API. Its availability depends on the browser and operating system; enabling a flag does not guarantee support. Unsupported detection stops the webcam and displays a message. See [Chrome’s Shape Detection API documentation](https://developer.chrome.com/docs/capabilities/shape-detection).


  <br>
  <img align="center" src="https://media.giphy.com/media/2sdM8tdDlqZGY7g3bT/giphy.gif" width="430">



▶️ [Watch a video demo](https://youtu.be/CL_B7iVpg4M)
   <br> 

   
## How to install
Build from source using the instructions below, then load `build/chrome` as an unpacked extension. The historical 0.1 release uses Manifest V2 and does not include these changes.

## Notice

- 🙀 I don’t trust my webcam and I have it covered, see this more as an experiment of Chromes new technology, than a product you'd use every day. 
- 🏴 To get the extension to work you’ll need to enable Chrome Experimental Features here: <br>
`chrome://flags#enable-experimental-web-platform-features`

- 💡If you’re in a dark setting it will probably be a bit buggy, as FaceDetector API is still not great in bad light. 

## Development

### Installation
1. Clone the repository `git clone https://github.com/Hemmingsson/FacePause`
2. Use Node.js 22 or later and run `npm ci`
3. Run `npm run build`

##### Load the extension in Chrome
1. Open Chrome browser and navigate to chrome://extensions
2. Select "Developer Mode" and then click "Load unpacked extension..."
3. From the file browser, choose to `FacePause/build/chrome`


### Developing
The following task can be used when you want to start developing the extension

- `npm run chrome-watch`


----



<a href="https://www.producthunt.com/posts/facepause?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-facepause" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=127262&theme=light" alt="FacePause - Look away to pause YouTube videos | Product Hunt Embed" style="width: 250px; height: 54px;" width="250px" height="54px" /></a>




## Build checks

`npm run build` creates Chrome Manifest V3 and Firefox Manifest V2 builds. Run `npm test` after building to check bundled assets and webcam failure handling. `npm run dist` creates ZIP files in `dist/`.
