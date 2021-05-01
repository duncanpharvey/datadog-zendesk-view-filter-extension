console.log("running syncViews.js");

const views = document.querySelector('[data-test-id="views_views-list_general-views-container"] > a');

if (views) {
  syncViews();
}
else {
  observeViewUpdates(); // TODO: also run when view refresh button is pressed
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

  // TODO: use attribute filter, look for other optimizations. https://stackoverflow.com/questions/31659567/performance-of-mutationobserver-to-detect-nodes-in-entire-dom/39332340
  observer.observe(document, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}

// TODO: test if works correctly when views are added/removed
function syncViews() {
  console.log("syncing views");
  var internalId = 1; // used for sorting
  chrome.storage.local.get(["views"], value => {
    const views = value.views;
    document.querySelectorAll('[data-test-id="views_views-list_general-views-container"] > a').forEach(view => {
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
    chrome.storage.local.set({ views: views });
  });
}