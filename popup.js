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
    Object.values(views).sort((a, b) => { return a.internalId - b.internalId; })
      .forEach(view => {
        const viewTitle = `<div class="view-title">${view.title}</div>`;
        const showButton = `<div class="view-button-wrapper"><button view-id="${view.id}" class="view-button show" selected=${view.displayed ? true : false}>Show!</button></div>`;
        const hideButton = `<div class="view-button-wrapper"><button view-id="${view.id}" class="view-button hide" selected=${view.displayed ? false : true}>Hide!</button></div>`;
        const viewWrapper = document.createElement("div");
        viewWrapper.innerHTML = `${viewTitle}${showButton}${hideButton}`;
        viewWrapper.classList.add("view-wrapper");
        viewContainer.appendChild(viewWrapper);
      });
    createButtonEventListeners();
  });
}

// open port for current tab if Zendesk
async function openMessagePort() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true, url: "https://datadog.zendesk.com/agent/*" });
  if (!tab) return;
  const port = chrome.tabs.connect(tab.id, { name: `connection for tab id: ${tab.id}` });
  return port;
}

async function createButtonEventListeners() {
  const port = await openMessagePort();
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", event => {
      const viewId = event.target.getAttribute("view-id");
      const action = event.target.classList.contains("show") ? "show" : "hide";

      const showButton = document.querySelector(`.view-button.show[view-id="${viewId}"]`);
      const hideButton = document.querySelector(`.view-button.hide[view-id="${viewId}"]`);
      chrome.storage.local.get(["views"], value => {
        const views = value.views;
        const displayed = views[viewId].displayed;

        // TODO: update to toggle state regardless of which button is clicked
        if (action == "show" && !displayed) {
          views[viewId].displayed = true;
          chrome.storage.local.set({ views: views });
          showButton.setAttribute("selected", true);
          hideButton.setAttribute("selected", false);
          if (port) port.postMessage({ id: viewId, action: action });
        } else if (action == "hide" && displayed) {
          views[viewId].displayed = false;
          chrome.storage.local.set({ views: views });
          showButton.setAttribute("selected", false);
          hideButton.setAttribute("selected", true);
          if (port) port.postMessage({ id: viewId, action: action });
        }
      });
    });
  });
}

// close extension UI if new window is focused on
chrome.windows.onFocusChanged.addListener(() => {
  window.close();
}, { windowTypes: ['normal'] });