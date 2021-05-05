console.log("running syncViews.js");

const views = document.querySelector('[data-test-id="views_views-list_general-views-container"] > a');

if (views) {
  syncViews();
}
else {
  observeViewUpdates(); // TODO: also run when view refresh button is pressed - must wait for new views to load
}

function observeViewUpdates() {
  console.log("observing view updates");
  var observer = new MutationObserver(() => {
    var viewList = document.querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a > [data-test-id="views_views-list_row_title"]');
    if (viewList.length >= 12) {
      console.log(`found ${viewList.length} views`);
      observer.disconnect();
      syncViews();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

function syncViews() {
  console.log("syncing views");
  var internalId = 1;
  chrome.storage.local.get(["views"], value => {
    const views = value.views;

    // hide view in UI if not currently shown in Zendesk
    Object.values(views).forEach(view => {
      const id = view.id;
      if (!document.querySelector(`[data-view-id="${id}"]`)) {
        console.log(`hiding view: ${id} from extension UI`);
        views[id].active = false;
      }
    });

    document.querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a').forEach(view => {
      if (view.style.display == "none") return; // skip views that are already not displayed by Zendesk
      const id = view.getAttribute("data-view-id");
      const title = view.firstElementChild.innerText;

      const viewIds = new Set(Object.keys(views));
      // update title and sort order if view is already in local storage
      if (viewIds.has(id)) {
        console.log(`view: ${id} already exists in local storage`);
        views[id].internalId = internalId;
        views[id].title = title;
        views[id].active = true;
      }
      // add view if it is not already in local storage
      else {
        console.log(`adding view: ${id} to local storage`);
        views[id] = {
          id: id,
          internalId: internalId, // used to sort views in extension UI in same order as in Zendesk
          title: title,
          displayed: true, // is the view currently toggled in the extension UI to be displayed
          active: true // is the view currently shown in Zendesk
        };
      }

      internalId++;
    });
    chrome.storage.local.set({ views: views });
    listenForViewUpdates();
    chrome.runtime.sendMessage({ listening: true });
  });

}

function listenForViewUpdates() {
  chrome.runtime.onConnect.addListener(port => {
    console.log(`listening for view updates on port: ${port.name}`);
    port.onMessage.addListener(msg => {
      console.log(`received ${msg.action} message for view: ${msg.id}`);
      const styleElement = document.getElementById("extension-styles");
      const rules = styleElement.sheet.cssRules;

      const ruleMapping = {};
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const id = rule.selectorText.match(/"([^"]+)"/)[1];
        ruleMapping[id] = i;
      }
      const id = msg.id;
      const action = msg.action;

      if (action == "show") {
        if (!(id in ruleMapping)) {
          console.log(`no rule to delete for view: ${id}`);
          return;
        }
        console.log(`listenForViewUpdates: removing rule for view: ${id}`);
        styleElement.sheet.deleteRule(ruleMapping[id]);
      } else if (action == "hide") {
        if (id in ruleMapping) {
          console.log(`rule already exists for view: ${id}`);
          return;
        }
        console.log(`listenForViewUpdates: adding rule for view: ${id}`);
        styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
      }
    });
  });
}