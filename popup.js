document.addEventListener("DOMContentLoaded", () => {
  createLoadingAnimation();
  openMessagePort();
});

function createLoadingAnimation() {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.innerHTML = `<div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`;
  document.body.appendChild(loader);
}

function createExtensionUI(port) {
  document.body.removeChild(document.getElementById("loader"));
  chrome.storage.local.get(["views"], value => {
    const views = value.views;
    const viewContainer = document.getElementById("view-container");
    const viewHeaderWrapper = document.createElement("div");
    viewHeaderWrapper.classList.add("view-header-wrapper");
    viewHeaderWrapper.innerHTML = `<div class="view-header">Select Zendesk views to hide</div><hr>`;
    viewContainer.appendChild(viewHeaderWrapper);
    if (Object.values(views).length == 0) {
      document.getElementById("message-container").style.display = "block";
      return;
    }
    Object.values(views).filter(view => { return view.active; }).sort((a, b) => { return a.internalId - b.internalId; })
      .forEach(view => {
        const viewTitle = `<div class="view-title-wrapper"><span class="view-title">${view.title}</span></div>`;
        const checkbox = `<div class="view-toggle-wrapper"><input id="view-${view.id}" view-id="${view.id}" type="checkbox" class="checkbox"><label for="view-${view.id}" class="toggle"></label></div>`;
        const viewWrapper = document.createElement("div");
        viewWrapper.innerHTML = `${checkbox}${viewTitle}`;
        viewWrapper.classList.add("view-wrapper");
        viewContainer.appendChild(viewWrapper);
        document.getElementById(`view-${view.id}`).checked = view.displayed;
      });
    createCheckboxEventListeners(port);
  });
}

// open port for current tab if Zendesk
async function openMessagePort() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true, url: "https://datadog.zendesk.com/agent/*" });
  if (!tab) {
    createExtensionUI(null);
  }
  // wait for page to load if not loaded yet
  else if (tab.status != "complete") {
    var listening = false;
    var synced = false;
    var port;
    chrome.runtime.onMessage.addListener(request => {
      if (request.listening) {
        listening = true;
        port = chrome.tabs.connect(tab.id, { name: `connection for tab id: ${tab.id}` });
      }
      if (request.synced) {
        synced = true;
      }
      if (listening && synced && port) {
        createExtensionUI(port);
      }
    });
  }
  // open port if page is already loaded
  else {
    var port = chrome.tabs.connect(tab.id, { name: `connection for tab id: ${tab.id}` });
    createExtensionUI(port);
  }
}

function createCheckboxEventListeners(port) {
  document.querySelectorAll(".checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", event => {
      const viewId = event.target.getAttribute("view-id");
      const checked = event.target.checked;

      chrome.storage.local.get(["views"], value => {
        const views = value.views;
        const displayed = views[viewId].displayed;

        if (checked && !displayed) {
          views[viewId].displayed = true;
          chrome.storage.local.set({ views: views });
          if (port) port.postMessage({ id: viewId, action: "show" });
        }
        else if (!checked && displayed) {
          views[viewId].displayed = false;
          chrome.storage.local.set({ views: views });
          if (port) port.postMessage({ id: viewId, action: "hide" });
        }
      });
    });
  });
}

// close extension UI if new window is focused on
chrome.windows.onFocusChanged.addListener(() => {
  window.close();
}, { windowTypes: ['normal'] });