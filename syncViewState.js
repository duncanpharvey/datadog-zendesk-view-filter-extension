createStyleElement();
syncViewState();

function createStyleElement() {
    if (document.getElementById("extension-styles")) return;
    const styleElement = document.createElement("style");
    styleElement.id = "extension-styles";
    document.querySelector("head").append(styleElement);
}

// clear out rule list and rebuild
function syncViewState() {
    const styleElement = document.getElementById("extension-styles");
    while (styleElement.sheet.cssRules.length > 0) {
        styleElement.sheet.deleteRule(0);
    }
    chrome.storage.local.get(["views"], value => {
        const views = value.views;
        Object.keys(views).forEach(id => {
            const view = views[id];
            if (!view.displayed) {
                styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
            }
        });
    });
}