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
        const showButton = `<div class="view-button-wrapper"><button view-id="${view.id}" class="view-button show" selected=${view.displayed ? true : false}>Show!</button></div>`;
        const hideButton = `<div class="view-button-wrapper"><button view-id="${view.id}" class="view-button hide" selected=${view.displayed ? false : true}>Hide!</button></div>`;
        const viewWrapper = document.createElement("div");
        viewWrapper.innerHTML = `${viewTitle}${showButton}${hideButton}`;
        viewWrapper.classList.add("view-wrapper");
        viewContainer.appendChild(viewWrapper);
      });

    // open port for each Zendesk tab
    var ports = [];
    chrome.tabs.query(
      { url: "https://datadog.zendesk.com/agent/*" },
      function (tabs) {
        tabs.forEach((tab) => {
          const port = chrome.tabs.connect(tab.id, {
            name: `connection for tab id: ${tab.id}`,
          });
          ports.push(port);
        });
      }
    );

    // send message to each Zendesk tab
    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const viewId = event.target.getAttribute("view-id");
        const action = event.target.classList.contains("show")
          ? "show"
          : "hide";

        const showButton = document.querySelector(`.view-button.show[view-id="${viewId}"]`);
        const hideButton = document.querySelector(`.view-button.hide[view-id="${viewId}"]`);
        chrome.storage.local.get(["views"], (value) => {
          const views = value.views;
          const displayed = views[viewId].displayed;

          // update to toggle state regardless of which button is clicked
          var sendMessage = false;
          if (action == "show" && !displayed) {
            views[viewId].displayed = true;
            showButton.setAttribute("selected", true);
            hideButton.setAttribute("selected", false);
            sendMessage = true;
          } else if (action == "hide" && displayed) {
            views[viewId].displayed = false;
            showButton.setAttribute("selected", false);
            hideButton.setAttribute("selected", true);
            sendMessage = true;
          }

          // only send a message if a change occurred
          if (sendMessage) {
            chrome.storage.local.set({ views: views });
            ports.forEach((port) => {
              port.postMessage({ id: viewId, action: action });
            });
          }
        });
      });
    });
  });
});
