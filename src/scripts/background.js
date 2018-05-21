chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request === 'openFlags') {
      chrome.tabs.create({url: 'chrome://flags#enable-experimental-web-platform-features'})
    }
  }
)
