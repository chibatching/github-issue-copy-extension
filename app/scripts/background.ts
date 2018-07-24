// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

chrome.runtime.onInstalled.addListener((details) => {
  chrome.browserAction.disable();
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url === undefined) {
    return;
  }
  let matches = tab.url.match(/.+:\/\/github.com\/.+?\/.+?\/issues\/\d+/);
  if (matches) {
    chrome.browserAction.enable(tabId);
  } else {
    chrome.browserAction.disable(tabId);
  }
});
