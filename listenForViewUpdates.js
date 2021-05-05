console.log("running listenForViewUpdates.js");

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

chrome.runtime.sendMessage({ listening: true }); // let extension know that content script is listening for messages