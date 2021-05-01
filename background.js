// on extension installation initialize local view storage, get views from open Zendesk tabs, and listen for view updates
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ views: {} }); // TODO: look to see if there are existing rules?

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
chrome.tabs.onActivated.addListener(() => {
  callSyncViewState()
});

// sync view state when window focus is changed
chrome.windows.onFocusChanged.addListener(() => {
  callSyncViewState()
});

function callSyncViewState() {
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://datadog.zendesk.com/agent/*" }, tabs => {
    if (tabs.length != 1) return;
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ["syncViewState.js"],
      });
  });
}