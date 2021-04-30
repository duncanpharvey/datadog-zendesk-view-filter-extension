console.log("content script!");

const styleElement = document.createElement("style");
styleElement.id = "extension-styles";
document.querySelector("head").append(styleElement);

refreshState(); // reapply css rules from local storage
observeViewChanges(); // only run if url is https://datadog.zendesk.com/agent/filters/* OR find event for changing tabs, also run on view refresh

function observeViewChanges() {
  console.log("observing view changes");
  var observer = new MutationObserver(() => {
    var viewList = document.querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a > [data-test-id="views_views-list_row_title"]');
    if (viewList.length >= 12) {
      console.log("view changes found");
      observer.disconnect();
      syncViews();
      console.log("done");
    }
  });

  observer.observe(document.querySelector("html"), {
    // use attribute filter, look for other optimizations
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
      .querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a')
      .forEach((view) => {
        const id = view.getAttribute("href").match(/[^\/]+$/)[0];

        const viewIds = new Set(Object.keys(views));
        if (viewIds.has(id)) return;

        const title = view.firstElementChild.innerText;

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
        styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
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
    const action = msg.action;

    if (action == "show") {
      styleElement.sheet.deleteRule(ruleMapping[id]);
    } else if (action == "hide") {
      styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
    }
  });
});
