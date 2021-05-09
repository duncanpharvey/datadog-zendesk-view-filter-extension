// on extension installation initialize local view storage, get views from open Zendesk tabs, and listen for view updates
chrome.runtime.onInstalled.addListener(async () => {
  await getViews().then(async views => {
    console.log("checking views");
    // create views object if none exists
    if (!views) {
      console.log("no views found, initializing views in storage");
      await initViews();
    }
  }).then(syncTabs);
});

function syncTabs() {
  console.log("syncing tabs");
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
}

function initViews() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ views: {} }, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      console.log("created empty views object in storage");
      resolve(true);
    });
  });
}

function getViews() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["views"], value => {
      console.log("getting views from storage");
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(value.views);
    });
  });
}