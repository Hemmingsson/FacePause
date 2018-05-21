
var sentinel = require('sentinel-js')

/* ==========================================================================
   Lets & Consts
   ========================================================================== */

// Extesnion Html
const htmlStr = '<div class="extension"> <section class="webcam"> <div class="webcam__inner"> <video id="webcam-player" width="0" height="0" autoplay></video> <canvas id="webcam-canvas"></canvas> </div></section> <section class="message">Face Pause Disabled</section> <section class="status"> </section> <section class="disable"> <label class="switch"> <input type="checkbox" disabled> <span class="slider round"></span> </label> </section></div>'
// Video & Canvas elms
let video
let canvas
let context
// Detection
let faceWasDetected = false
let faceDetector
let webcamStream
// Timouts & Intervalls
let detectionTimeOut
let allowTimeOut
let detectInterval

/* ==========================================================================
   Look for Video player, append  Extension into DOM and Inititate
   ========================================================================== */

sentinel.on('#movie_player', function (elm) {
  initExtension()
  console.log('BAJS')
})

/* ==========================================================================
   Ext Functionality
   ========================================================================== */

const initExtension = function () {
  if (!extensionExists()) {
    document.body.insertAdjacentHTML('beforeend', htmlStr)
    if ('FaceDetector' in window) { enableSwitch() } else { setMessage('apiError') }
    interactions()
  }
}

const toggleCapture = function (e) {
  if (e.srcElement.checked) { startCapture() } else { stopCapture() }
}

const startCapture = function () {
  // Initializing video & canvas lets
  video = document.querySelector('#webcam-player')
  canvas = document.querySelector('#webcam-canvas')
  context = canvas.getContext('2d')
  // Set up facedetector
  if (faceDetector === undefined) faceDetector = new FaceDetector()
  // Ask to access Webcam
  accessCamera()
  allowTimeOut = setTimeout(function () { setMessage('allow') }, 1400) // show help message to allow webcam connection
  // Start detecting faces
  detectInterval = setInterval(function () {
    // Draw webcam piture
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    // Detect faces
    detectFaces()
  }, 100)
}

const stopCapture = function () {
  // Stop Checking for faces
  clearInterval(detectInterval)
  // Stop Webcam
  webcamStream.getTracks()[0].stop()
  // Reset Detection bool
  faceWasDetected = false
  // Set switch to Off
  document.querySelector('.disable input').checked = false
  // Reset camera icon
  toggleCameraIcon()
  blinkCameraIcon(false)
  // Set Status Message
  setMessage('disabled')
  // Hide webcam window
  setPlayerVisability(false)
}

const beginPause = function () {
  detectionTimeOut = setTimeout(async function () {
    // Check if face is detected after 1 second
    const faces = await faceDetector.detect(canvas)
    if (!faces.length) { // if still no face in camera
      if (isSwitchOn()) {
        setMessage('notDetected')
      }
      if (isYoutTubePlaying()) {
        document.querySelector('#movie_player video').pause()
      }
    }
  }, 1000)
}

/* ==========================================================================
   Interactions
   ========================================================================== */

const interactions = function () {
  let elmStatus = document.querySelector('.status')
  let elmDisable = document.querySelector('.disable input')

  elmStatus.addEventListener('click', togglePlayer)
  elmDisable.addEventListener('click', toggleCapture)

  listenForUserPause()
}

const listenForUserPause = function () {
  let ytPlay = document.querySelector('#movie_player .ytp-play-button')
  ytPlay.addEventListener('click', activePause)
  window.addEventListener('keydown', function (e) { if (e.keyCode === 75) { activePause() } })
}

const activePause = function () {
  if (!isYoutTubePlaying() && isSwitchOn()) {
    stopCapture()
    document.querySelector('#movie_player video').pause()
  }
}

/* ==========================================================================
   Webcam
   ========================================================================== */

const accessCamera = function () {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
      // Play webcam in video element
      video.src = window.URL.createObjectURL(stream)
      webcamStream = stream
      video.play()
      // Stop allow webcam message from showing and show Start message instead
      clearTimeout(allowTimeOut)
      // Set start Message
      setMessage('init')
      // Set correct camera icon
      toggleCameraIcon()
      blinkCameraIcon(true)
      // Show webcam window
      setPlayerVisability(true)
    })
  }
}

/* ==========================================================================
   Face Detection
   ========================================================================== */

const detectFaces = async function () {
  const faces = await faceDetector.detect(canvas)
  if (faces.length) {
    if (!faceWasDetected) {
      faceWasDetected = true
      setTimeout(function () {
        setPlayerVisability(false)
      }, 2000)
    }

    clearTimeout(detectionTimeOut)
    drawFaces(faces)
    setMessage('detected')

    if (!isYoutTubePlaying()) {
      document.querySelector('#movie_player video').play()
    }
  } else {
    if (faceWasDetected) {
      beginPause()
    }
  }
}

const drawFaces = function (faces) {
  const color = '#00d647'
  faces.forEach(face => {
    const { width, height, top, left } = face.boundingBox
    context.strokeStyle = color
    context.lineWidth = 4
    context.strokeRect(left, top, width, height)
  })
}

/* ==========================================================================
   DOM manupilation
   ========================================================================== */

const enableSwitch = function () {
  let elmDisable = document.querySelector('.disable input')
  elmDisable.disabled = false
}

const togglePlayer = function () {
  if (isSwitchOn()) {
    toggleElmClass('.webcam', '--visible')
  } else {
    setPlayerVisability(false)
  }
}

const setPlayerVisability = function (visible) {
  let elmWebcam = document.querySelector('.webcam')
  if (visible) {
    elmWebcam.classList.add('--visible')
  } else {
    elmWebcam.classList.remove('--visible')
  }
}

const toggleCameraIcon = function () {
  toggleElmClass('.status', '--on')
}

const blinkCameraIcon = function (blink) {
  let elmIcon = document.querySelector('.status')
  if (blink) {
    elmIcon.classList.add('--recording')
  } else {
    elmIcon.classList.remove('--recording')
  }
}

const toggleElmClass = function (elmSelector, toggleClassName) {
  let elmWebcam = document.querySelector(elmSelector)
  elmWebcam.classList.toggle(toggleClassName)
}

const setMessage = function (state) {
  let elmMessage = document.querySelector('.message')
  if (state === 'apiError') {
    elmMessage.innerHTML = 'To Use FaceDetector API, Enable Experimental Features in Chrome <a href="chrome://flags#enable-experimental-web-platform-features">here</a>'
    document.querySelector('.extension a').addEventListener('click', function () { chrome.runtime.sendMessage('openFlags') })
  } else if (state === 'allow') {
    elmMessage.innerHTML = 'Allow Access to the Webcam Through the Dialog in Upper Left Corner'
  } else if (state === 'detected') {
    let str = 'Face Detected'
    if (elmMessage.innerHTML !== str) { elmMessage.innerHTML = str }
  } else if (state === 'notDetected') {
    let str = 'No Face Detected'
    if (elmMessage.innerHTML !== str) { elmMessage.innerHTML = str }
  } else if (state === 'disabled') {
    elmMessage.innerHTML = 'Face Play Disabled'
  } else if (state === 'init') {
    elmMessage.innerHTML = 'Detecting face...'
  } else {
    elmMessage.innerHTML = ''
  }
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const isSwitchOn = function () {
  let elmDisable = document.querySelector('.disable input')
  return elmDisable.checked
}

const isYoutTubePlaying = function () {
  return !document.querySelector('#movie_player video').paused
}

const extensionExists = function () {
  return document.querySelector('.extension')
}
