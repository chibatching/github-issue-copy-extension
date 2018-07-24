// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'
chrome.runtime.onInstalled.addListener(function (details) {
    chrome.browserAction.disable();
    console.log('previousVersion', details.previousVersion);
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url === undefined) {
        return;
    }
    var matches = tab.url.match(/.+:\/\/github.com\/.+?\/.+?\/issues\/\d+/);
    if (matches) {
        chrome.browserAction.enable(tabId);
    }
    else {
        chrome.browserAction.disable(tabId);
    }
});
