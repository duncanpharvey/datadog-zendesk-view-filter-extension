chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ views: {} });
});

/*
chrome.webNavigation.onHistoryStateUpdated.addListener(() => {
  chrome.runtime.onConnect.addListener(function (port) {
    console.log("background script!");
    port.postMessage({ sync: true }); // sync view state on page refresh / navigation
  });
});
*/
