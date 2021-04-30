// on extension installation initialize local view storage, get views from open Zendesk tabs, and listen for view updates
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ views: {} });

  chrome.tabs.query({ url: "https://datadog.zendesk.com/agent/*" }, tabs => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["syncViews.js"],
        });

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["listenForViewUpdates.js"],
        });
    });
  });
});

// sync view state when tab is navigated back to
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (!/^https:\/\/datadog.zendesk.com\/agent\/.*/.test(tab.url)) return;
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["syncViewState.js"],
      });
  });
});
