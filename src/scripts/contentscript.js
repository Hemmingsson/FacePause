
const sentinel = require('sentinel-js')

const extensionMarkup = '<div class="extension"> <section class="webcam"> <div class="webcam__inner"> <video id="webcam-player" width="0" height="0" autoplay></video> <canvas id="webcam-canvas"></canvas> </div></section> <section class="message">FacePause Disabled</section> <section class="status"> </section> <section class="disable"> <label class="switch"> <input type="checkbox" disabled> <span class="slider round"></span> </label> </section></div>'
const detectionBoxColor = '#00d647'
let faceWasDetectedOnce
let faceDetector
let webCamStream
let undetectedTimer
let detectInterval

/* ==========================================================================
   Ext Functionality
   ========================================================================== */

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
  updateStatus(status.startingDetection)
  toggleCameraIcon()
  blinkCameraIcon(true)
  showCaptureVideo(true)
  startFaceDetection(video, canvas, context)
}

const stopCapture = () => {
  clearInterval(detectInterval)
  if (webCamStream) webCamStream.getTracks()[0].stop()
  faceWasDetectedOnce = false
  document.querySelector('.disable input').checked = false
  toggleCameraIcon()
  blinkCameraIcon(false)
  updateStatus(status.extensionDisabled)
  showCaptureVideo(false)
}

const toggleCapture = e => {
  if (e.srcElement.checked) { initCapture() } else { stopCapture() }
}

/* ==========================================================================
   Interactions
   ========================================================================== */

const interactions = () => {
  let elmStatus = document.querySelector('.status')
  let elmDisable = document.querySelector('.disable input')
  let elmYtPlayerButton = document.querySelector('#movie_player .ytp-play-button')

  elmStatus.addEventListener('click', togglePlayerVisebility)
  elmDisable.addEventListener('click', toggleCapture)

  // When a user hits space or k, disable extension
  elmYtPlayerButton.addEventListener('click', userPause)
  window.addEventListener('keydown', e => { if (e.keyCode === 75) { userPause() } })
}

const userPause = () => {
  if (isExtesnionActive() && !isYoutTubePlaying()) {
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

const failToCapture = () => {
  stopCapture()
  updateStatus(status.webCameBlocked)
}

const streamWebCam = (stream, video) => {
  video.src = window.URL.createObjectURL(stream)
  webCamStream = stream
  video.play()
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
    setTimeout(() => { showCaptureVideo(false) }, 2000)
  }
}

const faceUndetected = (faces, canvas) => {
  undetectedTimer = setTimeout(async () => {
    const faces = await faceDetector.detect(canvas)
    if (isExtesnionActive() && !faces.length && faceWasDetectedOnce && isYoutTubePlaying()) {
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

const showCaptureVideo = visible => {
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

const togglePlayerVisebility = () => isExtesnionActive() ? toggleElmClass('.webcam', '--visible') : showCaptureVideo(false)

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
  if (status === status.enableExperimental) openExperimentalFeaturesTab()
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const isYoutTubePlaying = () => !document.querySelector('#movie_player video').paused

const isExtesnionActive = () => {
  let elmDisable = document.querySelector('.disable input')
  return elmDisable.checked
}

const isExtensionExisting = () => document.querySelector('.extension')

const openExperimentalFeaturesTab = () => document.querySelector('.extension a').addEventListener('click', () => { chrome.runtime.sendMessage('openFlags') })
