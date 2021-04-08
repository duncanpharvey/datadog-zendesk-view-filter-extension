document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["views"], (value) => {
    const views = value.views;
    const viewContainer = document.getElementById("view-container");
    Object.values(views)
      .sort((a, b) => {
        return a.internalId - b.internalId;
      })
      .forEach((view) => {
        const viewTitle = `<div class="view-title">${view.title}</div>`;
        const button = `<div class="view-button-wrapper"><button id="${view.id}" class="view-button">Click!</button></div>`;
        const viewWrapper = document.createElement("div");
        viewWrapper.innerHTML = viewTitle + button;
        viewWrapper.id = `view-${view.id}`;
        viewWrapper.classList.add("view-wrapper");
        viewContainer.appendChild(viewWrapper);
      });

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const port = chrome.tabs.connect(tabs[0].id, {
        name: "content connection",
      });
      document.querySelectorAll(".view-button").forEach((button) => {
        button.addEventListener("click", (event) => {
          port.postMessage({ id: event.target.id });
        });
      });
    });

    /*
    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        chrome.storage.local.get(["views"], (value) => {
          const views = value.views;
          const id = event.target.id;
          views[id].displayed = !views[id].displayed;
          chrome.storage.local.set({ views: views });
        });
      });
    });
*/
  });
});
