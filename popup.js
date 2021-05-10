// TODO: is there a better method using promises?
var domLoaded = false;
var synced = false;
var listening = false;

document.addEventListener("DOMContentLoaded", async () => {
  domLoaded = true;
  console.log("creating extension UI");
  await createExtensionUI();
  console.log("creating checkbox event listeners");
  await createCheckboxEventListeners();
});

chrome.runtime.onMessage.addListener(async msg => {
  if (msg.synced) {
    synced = true;
  }
  if (domLoaded && synced) {
    await createExtensionUI();
    await createCheckboxEventListeners();
  }
});

async function createExtensionUI() {
  const views = await getViews();
  const viewContainer = document.getElementById("view-container");
  // reset views if already loaded
  document.querySelectorAll(".view-wrapper").forEach(viewWrapperElement => {
    viewContainer.removeChild(viewWrapperElement);
  });
  Object.values(views).filter(view => { return view.active; }).sort((a, b) => { return a.internalId - b.internalId; })
    .forEach(view => {
      const viewTitle = `<div class="view-title-wrapper"><span class="view-title">${view.title}</span></div>`;
      const checkbox = `<div class="view-toggle-wrapper"><input id="view-${view.id}" view-id="${view.id}" type="checkbox" class="checkbox"><label for="view-${view.id}" class="toggle"></label></div>`;
      const viewWrapper = document.createElement("div");
      viewWrapper.classList.add("view-wrapper");
      viewWrapper.innerHTML = `${checkbox}${viewTitle}`;
      viewContainer.appendChild(viewWrapper);
      document.getElementById(`view-${view.id}`).checked = view.displayed;
    });
}

async function createCheckboxEventListeners() {
  document.querySelectorAll(".checkbox").forEach(async checkbox => {
    checkbox.addEventListener("change", async event => {
      const viewId = event.target.getAttribute("view-id");
      const checked = event.target.checked;

      const views = await getViews();
      const displayed = views[viewId].displayed;

      if (checked && !displayed) {
        views[viewId].displayed = true;
        await setViews(views);
        sendMessage(viewId, "show");
      }
      else if (!checked && displayed) {
        views[viewId].displayed = false;
        await setViews(views);
        sendMessage(viewId, "hide");
      }
    });
  });
}

function sendMessage(viewId, action) {
  chrome.tabs.query({ url: "https://datadog.zendesk.com/agent/*" }, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { id: viewId, action: action });
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

// close extension UI if new window is focused on
chrome.windows.onFocusChanged.addListener(() => {
  window.close();
}, { windowTypes: ['normal'] });