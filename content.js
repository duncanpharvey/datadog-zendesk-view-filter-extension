console.log("content script!");

const styleElement = document.createElement("style");
styleElement.id = "extension-styles";
styleElement.textContent = "";
document.querySelector("html").append(styleElement); // try to append to head instead

refreshState(); // reapply css rules from local storage
observeViewChanges(); // only run if url is https://datadog.zendesk.com/agent/filters/* OR find event for changing tabs, also run on view refresh

function observeViewChanges() {
  console.log("observing view changes");
  var observer = new MutationObserver(() => {
    var viewList = document.querySelectorAll(
      "ul.ember-view.filters > li > a > span"
    );
    if (viewList.length >= 12) {
      console.log("view changes found");
      observer.disconnect();
      syncViews();
      console.log("done");
    }
  });

  observer.observe(document.querySelector("html"), { // use attribute filter, look for other optimizations
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}

function syncViews() {
  console.log("getting");
  var internalId = 1; // used for sorting
  chrome.storage.local.get(["views"], (value) => {
    const views = value.views;
    console.log(`views: ${JSON.stringify(views)}`);
    document
      .querySelectorAll(
        "ul.ember-view.filters > li:not(.filter-group-heading ~ li)"
      )
      .forEach((view) => {
        const linkElement = view.firstElementChild;
        const id = linkElement.getAttribute("href").match(/[^\/]+$/)[0];

        /*
        if (!view.classList.contains("custom-extension-views")) {
          view.classList.add("custom-extension-views");
          view.setAttribute("view-id", id);
        }
        */

        console.log(id);
        console.log(Object.keys(views));
        const viewIds = new Set(Object.keys(views));
        if (viewIds.has(id)) return;
        console.log("continued");

        const title = linkElement.innerText
          .replace(/(\r\n|\n|\r)/gm, "") // remove carriage returns
          .replace(/[0-9]+$/, "") // remove number of tickets in view
          .trim(); // remove whitespaces

        views[id] = {
          id: id,
          internalId: internalId,
          title: title,
          displayed: view.style.display == "none" ? false : true, // find a way to exclude deleted differently. Also the display may be the only thing that shouldn't be resynced
        };

        internalId++; // May need to move up so it's called each time. Reset internalId on each sync
      });
    console.log(views);
    chrome.storage.local.set({ views: views });
  });
}

/*
function listenForUpdates() {
  console.log("listening");
  chrome.storage.onChanged.addListener((changes, areaName) => {
    // why is this getting called when everything is initialized?
    console.log("updating views");
    document.querySelectorAll(".custom-extension-views").forEach((view) => {
      const id = view.getAttribute("view-id");
      const newDisplayStatus = changes.views.newValue[id].displayed;
      if (view.classList.contains("hide-view") && newDisplayStatus) {
        view.classList.remove("hide-view");
      } else if (!view.classList.contains("hide-view") && !newDisplayStatus) {
        view.classList.add("hide-view");
      }
    });
  });
  console.log("added");
}

function listenForUpdates2() {
  console.log("listening 2");
  chrome.storage.onChanged.addListener((changes, areaName) => {
    // why is this getting called when everything is initialized?
    console.log("updating views 2");
    const styleElement = document.getElementById("extension-styles");

    const rules = styleElement.sheet.cssRules;
    const ruleMapping = {};
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const id = rule.selectorText.match(/"([^"]+)"/)[1];
      ruleMapping[id] = i;
    }

    document
      .querySelectorAll(
        "ul.ember-view.filters > li:not(.filter-group-heading ~ li)"
      )
      .forEach((view) => {
        const id = view.firstElementChild
          .getAttribute("href")
          .match(/[^\/]+$/)[0];
        const displayed = changes.views.newValue[id].displayed;
        if (!(id in ruleMapping) && !displayed) {
          styleElement.sheet.insertRule(
            `[href$="${id}"] { display: none !important;}`
          );
        } else if (id in ruleMapping && displayed) {
          console.log("deleting");
          console.log(id);
          styleElement.sheet.deleteRule(ruleMapping[id]);
        }
      });
  });
  console.log("added 2");
}
*/

function refreshState() {
  chrome.storage.local.get(["views"], (value) => {
    const views = value.views;
    console.log(views);
    Object.keys(views).forEach((id) => {
      const view = views[id];
      if (!view.displayed) {
        console.log(styleElement.sheet.cssRules);
        console.log("hiding");
        console.log(id);
        styleElement.sheet.insertRule(
          `[href$="${id}"] { display: none !important;}`
        );
        console.log(styleElement.sheet.cssRules);
      }
    });
  });
}

// clean up
chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    console.log(msg);

    const styleElement = document.getElementById("extension-styles");

    const rules = styleElement.sheet.cssRules;
    const ruleMapping = {};
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const id = rule.selectorText.match(/"([^"]+)"/)[1];
      ruleMapping[id] = i;
    }
    console.log(ruleMapping);
    const id = msg.id;
    chrome.storage.local.get(["views"], (value) => {
      const views = value.views;
      const displayed = views[id].displayed;
      console.log(`displayed: ${displayed}`);
      if (displayed) {
        console.log("hide");
        styleElement.sheet.insertRule(
          `[href$="${id}"] { display: none !important;}`
        );
        views[id].displayed = false; // move to popup so can toggle off zendesk page
      } else if (!displayed) {
        console.log("show");
        styleElement.sheet.deleteRule(ruleMapping[id]);
        views[id].displayed = true; // move to popup so can toggle off zendesk page
      }
      console.log(styleElement.sheet.cssRules);
      chrome.storage.local.set({ views: views }); // move to popup so can toggle off zendesk page
    });
  });
});

/*
function listenForRefresh() {
  var port = chrome.runtime.connect({ name: "mycontentscript" }); // open connection with service worker
  port.onMessage.addListener(function (message, sender) {
    if (message.sync) {
      console.log("message received");
      // syncViews(); // get new views if available

      // create stylesheet from storage
      chrome.storage.local.get(["views"], (value) => {
        const views = value.views;
        console.log(views);

        document
          .querySelectorAll(
            "ul.ember-view.filters > li:not(.filter-group-heading ~ li)"
          )
          .forEach((view) => {
            const id = view.firstElementChild
              .getAttribute("href")
              .match(/[^\/]+$/)[0];

            const displayed = views[id].displayed;
            if (!displayed) {
              console.log("hiding");
              console.log(id);
              styleElement.sheet.insertRule(
                `[href$="${id}"] { display: none !important;}`
              );
            }
          });
      });
    }
  });
}
*/
