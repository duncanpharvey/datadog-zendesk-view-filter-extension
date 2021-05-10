// on extension installation initialize local view storage, get views from open Zendesk tabs, and listen for view updates
chrome.runtime.onInstalled.addListener(async () => {
  console.log("getting views");
  const views = await getViews();

  console.log("checking views");
  // create views object if none exists
  if (!views) {
    console.log("no views found, initializing views in storage");
    await setViews({});
  }

  console.log("syncing tabs");
  syncTabs();
});

function syncTabs() {
  chrome.tabs.query({ url: "https://datadog.zendesk.com/agent/*" }, tabs => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["syncViews.js"],
        });
    });
  });
}

function setViews(views) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ views: views }, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

function getViews() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["views"], value => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(value.views);
    });
  });
}