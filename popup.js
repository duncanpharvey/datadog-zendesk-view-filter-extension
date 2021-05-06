// TODO: is there a better method using promises?
var domLoaded = false;
var synced = false;

document.addEventListener("DOMContentLoaded", () => {
  domLoaded = true;
  createExtensionUI();
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.synced) {
    synced = true;
  }
  if (domLoaded && synced) {
    createExtensionUI();
  }
});

function createExtensionUI() {
  chrome.storage.local.get(["views"], value => {
    const views = value.views;
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
    createCheckboxEventListeners();
  });
}

function createCheckboxEventListeners() {
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
          sendMessage(viewId, "show");
        }
        else if (!checked && displayed) {
          views[viewId].displayed = false;
          chrome.storage.local.set({ views: views });
          sendMessage(viewId, "hide");
        }
      });
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

// close extension UI if new window is focused on
chrome.windows.onFocusChanged.addListener(() => {
  window.close();
}, { windowTypes: ['normal'] });