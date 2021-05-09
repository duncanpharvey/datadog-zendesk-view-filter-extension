console.log("running listenForViewUpdates.js");

createStyleElement();
listenForViewUpdates();

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
            styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
        }
    });
}