console.log("running syncViewState.js");

syncViewState();

function syncViewState() {
    console.log("syncing view states");
    const styleElement = document.getElementById("extension-styles");

    chrome.storage.local.get(["views"], value => {
        const views = value.views;

        const viewsWithRule = new Set();
        const rules = styleElement.sheet.cssRules;

        // remove rules from end of list first so indexes don't change
        for (let i = rules.length - 1; i >= 0; i--) {
            const rule = rules[i];
            const id = rule.selectorText.match(/"([^"]+)"/)[1];
            if (views[id].displayed) {
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
                styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
            }
        });
    });
}