
const sentinel = require('sentinel-js')

const extensionMarkup = '<div class="extension"> <section class="webcam"> <div class="webcam__inner"> <video id="webcam-player" width="0" height="0" autoplay></video> <canvas id="webcam-canvas"></canvas> </div></section> <section class="message">FacePause Disabled</section> <section class="status"> </section> <section class="disable"> <label class="switch"> <input type="checkbox" disabled> <span class="slider round"></span> </label> </section></div>'
const detectionBoxColor = '#00d647'
let faceWasDetectedOnce
let faceDetector
let webCamStream
let undetectedTimer
let detectInterval

// When Video player appears in the wild, Inititate Extension
sentinel.on('#movie_player', elm => initExtension())

const initExtension = () => {
  if (!isExtensionExisting()) {
    appendExtensionMarkup(extensionMarkup)
    'FaceDetector' in window ? enableSwitch() : updateStatus(status.enableExperimental)
    interactions()
  }
}

const initCapture = () => {
  const elmVideo = document.querySelector('#webcam-player')
  const elmCanvas = document.querySelector('#webcam-canvas')
  const canvasContext = elmCanvas.getContext('2d')
  if (faceDetector === undefined) faceDetector = new FaceDetector()
  // show help message to allow webcam connection if no action is taken for 2 seconds
  let allowMessageTimeOut = setTimeout(() => { updateStatus(status.allowWebCam) }, 2000)
  askForWebCamAccess().then(stream => {
    startCapture(stream, elmVideo, elmCanvas, canvasContext)
    clearTimeout(allowMessageTimeOut)
  }).catch(() => {
    failToCapture()
    clearTimeout(allowMessageTimeOut)
  })
}

const startCapture = (stream, video, canvas, context, timeOut) => {
  streamWebCam(stream, video)
  toggleCameraIcon()
  blinkCameraIcon(true)
  startFaceDetection(video, canvas, context)
  showCaptureWindow(true)
  updateStatus(status.startingDetection)
}

const stopCapture = () => {
  faceWasDetectedOnce = false
  clearInterval(detectInterval)
  stopWebCam()
  toggleCameraIcon()
  blinkCameraIcon(false)
  document.querySelector('.disable input').checked = false
  showCaptureWindow(false)
  updateStatus(status.extensionDisabled)
}

const failToCapture = () => {
  stopCapture()
  updateStatus(status.webCameBlocked)
}

const toggleCapture = e => e.srcElement.checked ? initCapture() : stopCapture()

/* ==========================================================================
   Interactions
   ========================================================================== */

const interactions = () => {
  const elmStatus = document.querySelector('.status')
  const elmDisable = document.querySelector('.disable input')
  const elmYtPlayerButton = document.querySelector('#movie_player .ytp-play-button')

  elmStatus.addEventListener('click', togglePlayerVisebility)
  elmDisable.addEventListener('click', toggleCapture)

  // When a user hits the play button, space or k, disable extension
  elmYtPlayerButton.addEventListener('click', userPause)
  window.addEventListener('keydown', e => { if (e.keyCode === 75) { userPause() } })
}

const userPause = () => {
  if (isExtensionActive() && !isYoutTubePlaying()) {
    stopCapture()
    videoPause()
  }
}

/* ==========================================================================
   Webcam
   ========================================================================== */

const askForWebCamAccess = () => new Promise((resolve, reject) => {
  const mediaDevicesAvalible = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  if (mediaDevicesAvalible) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(resolve).catch(reject)
  } else { reject() }
})

const streamWebCam = (stream, video) => {
  video.src = window.URL.createObjectURL(stream)
  webCamStream = stream
  video.play()
}

const stopWebCam = () => {
  if (webCamStream) webCamStream.getTracks()[0].stop()
}

/* ==========================================================================
   Face Detection
   ========================================================================== */

const startFaceDetection = (video, canvas, context) => {
  detectInterval = setInterval(() => {
    drawWebCam(video, canvas, context)
    detectFaces(canvas, context)
  }, 100)
}

const detectFaces = async (canvas, context) => {
  const faces = await faceDetector.detect(canvas)
  const faceWasDetected = faces.length
  faceWasDetected ? faceDetected(faces, context) : faceUndetected(faces, canvas)
}

const faceDetected = (faces, context) => {
  clearTimeout(undetectedTimer)
  updateStatus(status.detected)
  drawFaceBoxes(faces, context)
  if (!isYoutTubePlaying()) videoPlays()
  if (!faceWasDetectedOnce) {
    faceWasDetectedOnce = true
    setTimeout(() => { showCaptureWindow(false) }, 2000)
  }
}

const faceUndetected = (faces, canvas) => {
  undetectedTimer = setTimeout(async () => {
    const faces = await faceDetector.detect(canvas)
    if (isExtensionActive() && !faces.length && faceWasDetectedOnce && isYoutTubePlaying()) {
      videoPause()
      updateStatus(status.undetected)
    }
  }, 1000)
}

/* ==========================================================================
   Canvas Rendering
   ========================================================================== */

const drawWebCam = (video, canvas, context) => context.drawImage(video, 0, 0, canvas.width, canvas.height)

const drawFaceBoxes = (faces, context) => {
  faces.forEach(face => {
    const { width, height, top, left } = face.boundingBox
    context.strokeStyle = detectionBoxColor
    context.lineWidth = 4
    context.strokeRect(left, top, width, height)
  })
}

/* ==========================================================================
   DOM manupilation
   ========================================================================== */

const enableSwitch = () => {
  let elmDisable = document.querySelector('.disable input')
  elmDisable.disabled = false
}

const showCaptureWindow = visible => {
  let elmWebcam = document.querySelector('.webcam')
  visible ? elmWebcam.classList.add('--visible') : elmWebcam.classList.remove('--visible')
}

const blinkCameraIcon = blink => {
  let elmIcon = document.querySelector('.status')
  let animationSelector = '--recording'
  blink ? elmIcon.classList.add(animationSelector) : elmIcon.classList.remove(animationSelector)
}

const toggleElmClass = (elmSelector, toggleClassName) => {
  let elmWebcam = document.querySelector(elmSelector)
  elmWebcam.classList.toggle(toggleClassName)
}

const toggleCameraIcon = () => toggleElmClass('.status', '--on')

const togglePlayerVisebility = () => isExtensionActive() ? toggleElmClass('.webcam', '--visible') : showCaptureWindow(false)

const videoPlays = () => document.querySelector('#movie_player video').play()

const videoPause = () => document.querySelector('#movie_player video').pause()

const appendExtensionMarkup = html => document.body.insertAdjacentHTML('beforeend', html)

/* ==========================================================================
   Status message
   ========================================================================== */

const status = {
  enableExperimental: 'To Use FaceDetector API, Enable Experimental Features in Chrome <a href="chrome://flags#enable-experimental-web-platform-features">here</a>',
  allowWebCam: 'Allow Access to the Webcam Through the Dialog in Upper Left Corner',
  detected: 'Face Detected',
  undetected: 'No Face Detected',
  extensionDisabled: 'FacePause Disabled',
  startingDetection: 'Detecting face...',
  webCameBlocked: 'You have blocked acces to the webcam, click the 🔒 to the left of the address bar to change'
}

const updateStatus = status => {
  let elmMessage = document.querySelector('.message')
  if (elmMessage.innerHTML !== status) elmMessage.innerHTML = status
  if (status === status.enableExperimental) experimentalFeaturesLink()
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const isExtensionActive = () => document.querySelector('.disable input').checked

const isYoutTubePlaying = () => !document.querySelector('#movie_player video').paused

const isExtensionExisting = () => document.querySelector('.extension')

const experimentalFeaturesLink = () => document.querySelector('.extension a').addEventListener('click', () => { chrome.runtime.sendMessage('openFlags') })
