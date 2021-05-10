console.log("running syncViews.js");

// call synchronously while syncing views
createStyleElement();
syncViewStates();
listenForViewUpdates();

const viewList = document.querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a > [data-test-id="views_views-list_row_title"]');

if (viewList.length >= 12) {
  init();
}
else {
  observeViewUpdates(); // TODO: also run when view refresh button is pressed - must wait for new views to load
}

async function init() {
  await syncViews(); // call asynchronously
  chrome.runtime.sendMessage({ synced: true });
  console.log("synced");
}

function observeViewUpdates() {
  console.log("observing view updates");
  var observer = new MutationObserver(() => {
    var viewList = document.querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a > [data-test-id="views_views-list_row_title"]');
    if (viewList.length >= 12) {
      console.log(`found ${viewList.length} views`);
      observer.disconnect();
      init();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

async function syncViews() {
  console.log("syncing views");
  var internalId = 1;
  const views = await getViews();

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
  await setViews(views);
  await syncViewStates(); // in case any views that were previously hidden but inactive became active again
}

function createStyleElement() {
  if (document.getElementById("extension-styles")) {
    console.log("style element already exists");
    return;
  }
  console.log("creating style element");
  const styleElement = document.createElement("style");
  styleElement.id = "extension-styles";
  document.querySelector("head").append(styleElement);
}

async function syncViewStates() {
  console.log("syncing view states");
  const styleElement = document.getElementById("extension-styles");

  const views = await getViews();

  const viewsWithRule = new Set();
  const rules = styleElement.sheet.cssRules;

  // remove rules from end of list first so indexes don't change
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i];
    const id = rule.selectorText.match(/"([^"]+)"/)[1];
    if (views.hasOwnProperty(id) && views[id].displayed) {
      console.log(`syncViewState: removing rule for view: ${id}`);
      styleElement.sheet.deleteRule(i);
    }
    else {
      viewsWithRule.add(id);
    }
  }

  Object.values(views).forEach(view => {
    const id = view.id;
    const displayed = view.displayed;
    if (!displayed && !(viewsWithRule.has(id))) {
      console.log(`syncViewState: adding rule for view: ${id}`);
      styleElement.sheet.insertRule(`[data-view-id="${id}"] { display: none !important;}`);
    }
  });
}

function listenForViewUpdates() {
  console.log(`listening for view updates`);
  chrome.runtime.onMessage.addListener(msg => {
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
      if (!ruleMapping.hasOwnProperty(id)) {
        console.log(`no rule to delete for view: ${id}`);
        return;
      }
      console.log(`listenForViewUpdates: removing rule for view: ${id}`);
      styleElement.sheet.deleteRule(ruleMapping[id]);
    } else if (action == "hide") {
      if (ruleMapping.hasOwnProperty(id)) {
        console.log(`rule already exists for view: ${id}`);
        return;
      }
      console.log(`listenForViewUpdates: adding rule for view: ${id}`);
      styleElement.sheet.insertRule(`[data-view-id="${id}"] { display: none !important;}`);
    }
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