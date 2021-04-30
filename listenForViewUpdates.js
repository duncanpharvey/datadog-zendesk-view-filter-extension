// listen for update messages from extension
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
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
            styleElement.sheet.deleteRule(ruleMapping[id]);
        } else if (action == "hide") {
            styleElement.sheet.insertRule(`[href$="${id}"] { display: none !important;}`);
        }
    });
});