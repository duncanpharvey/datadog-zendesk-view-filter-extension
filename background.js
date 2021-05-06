// on extension installation initialize local view storage, get views from open Zendesk tabs, and listen for view updates
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["views"], value => {
    if (Object.keys(value.views).length == 0) {
      chrome.storage.local.set({ views: {} }); // create views object if none exists
    }
  });

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
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["syncViewState.js"],
        });
    });
  });
});