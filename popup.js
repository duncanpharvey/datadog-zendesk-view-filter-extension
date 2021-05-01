document.addEventListener("DOMContentLoaded", () => {
  createExtensionUI();
});

function createExtensionUI() {
  chrome.storage.local.get(["views"], value => {
    const views = value.views;
    if (Object.values(views).length == 0) {
      const messageContainer = document.getElementById("message-container");
      messageContainer.style.display = "block";
      return;
    }
    const viewContainer = document.getElementById("view-container");
    const viewHeaderWrapper = document.createElement("div");
    viewHeaderWrapper.classList.add("view-header-wrapper");
    viewHeaderWrapper.innerHTML = `<div class="view-header">Select Zendesk views to hide</div><hr>`;
    viewContainer.appendChild(viewHeaderWrapper);
    Object.values(views).sort((a, b) => { return a.internalId - b.internalId; })
      .forEach(view => {
        const viewTitle = `<div class="view-title">${view.title}</div>`;
        const showButton = `<div class="view-button-wrapper"><button view-id="${view.id}" class="view-button show" selected=${view.displayed ? true : false}>Show</button></div>`;
        const hideButton = `<div class="view-button-wrapper"><button view-id="${view.id}" class="view-button hide" selected=${view.displayed ? false : true}>Hide</button></div>`;
        const viewWrapper = document.createElement("div");
        viewWrapper.innerHTML = `${showButton}${hideButton}${viewTitle}`;
        viewWrapper.classList.add("view-wrapper");
        viewContainer.appendChild(viewWrapper);
      });
    createButtonEventListeners();
  });
}

// open port for current tab if Zendesk
async function openMessagePort() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true, url: "https://datadog.zendesk.com/agent/*" });
  if (!tab) return null;
  const port = chrome.tabs.connect(tab.id, { name: `connection for tab id: ${tab.id}` });
  return port;
}

async function createButtonEventListeners() {
  const port = await openMessagePort();
  document.querySelectorAll(".view-button").forEach(button => {
    button.addEventListener("click", event => {
      const viewId = event.target.getAttribute("view-id");

      const showButton = document.querySelector(`.view-button.show[view-id="${viewId}"]`);
      const hideButton = document.querySelector(`.view-button.hide[view-id="${viewId}"]`);
      chrome.storage.local.get(["views"], value => {
        const views = value.views;
        const displayed = views[viewId].displayed;

        if (!displayed) {
          views[viewId].displayed = true;
          chrome.storage.local.set({ views: views });
          showButton.setAttribute("selected", true);
          hideButton.setAttribute("selected", false);
          if (port) port.postMessage({ id: viewId, action: "show" });
        } else if (displayed) {
          views[viewId].displayed = false;
          chrome.storage.local.set({ views: views });
          showButton.setAttribute("selected", false);
          hideButton.setAttribute("selected", true);
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