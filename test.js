/*
function searchViews() {
  var observer = new MutationObserver(() => {
    var views = document.querySelectorAll(createFilter(filterArray));
    if (
      views.length > 0 &&
      Array.from(views)
        .map((view) => view.parentElement.style.display)
        .every((display) => display != "none")
    ) {
      observer.disconnect();
      views.forEach((view) => {
        view.parentElement.style.display = "none";
      });
    }
  });

  observer.observe(document.body, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}

const filterArray = [
  360108309851,
  360111569292,
  360088240092,
  360112803832,
  360114222731,
  360115180871,
  360115502072,
  "suspended",
];

function createFilter(filterArray) {
  filter = "";
  filterArray.forEach((view) => {
    filter += `[href$='${view}'],`;
  });
  return `${filter.slice(0, -1)}`;
}

function initialize() {
  var observer = new MutationObserver(() => {
    var refreshButton = document.querySelector(
      "[class='pane left section'] > header > h1 > button"
    );
    if (refreshButton) {
      observer.disconnect();
      refreshButton.addEventListener("click", searchViews);
    }
  });

  observer.observe(document.body, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}

initialize();
searchViews();
*/

/*

console.log("content script!");

console.log(document);
console.log(document.querySelector("html"));

// initialize style
// TODO: get list of available views. Initialize with display: block and send to service worker so extension can list them
const style = document.createElement("style");
style.id = "style-element";
style.textContent = "";
document.querySelector("html").append(style);

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log(changes);
  const change = changes.css.newValue;
  const elementId = Object.keys(change)[0];
  console.log(elementId);
  console.log(change[elementId]);
  console.log(style.sheet.cssRules);
  var stylesheet = document.getElementById("style-element");
  stylesheet.insertRule()
  // document.getElementById("style-element").style.sheet.cssRules
});
/*

// TODO: persist last state of view settings (move these calls to functions)
chrome.storage.local.get("css", result => {
    console.log(`css: ${JSON.stringify(result.css)}`);
    if (result.css[1] == false) {
        console.log("changing green");
        const style = document.getElementById("style-element");
        if (style.sheet.cssRules.length > 0) style.sheet.cssRules[0].style.backgroundColor = "green";
        else style.textContent = "body { background: green }";
    }
    else if (result.css[1] == true) {
        console.log("changing blue");
        const style = document.getElementById("style-element");
        if (style.sheet.cssRules.length > 0) style.sheet.cssRules[0].style.backgroundColor = "blue";
        else style.textContent = "body { background: blue }";
    }
});

var port = chrome.runtime.connect({ name: "mycontentscript" }); // open connection with service worker
port.onMessage.addListener(function (message, sender) {
    // TODO: adapt style update to Zendesk views
    console.log('received message');
    console.log(`message: ${JSON.stringify(message)}`);
    if (message.greeting === "hello") {
        console.log(message.greeting);
    }
    if (message[1] == false) {
        console.log("changing green");
        const style = document.getElementById("style-element");
        if (style.sheet.cssRules.length > 0) style.sheet.cssRules[0].style.backgroundColor = "green";
        else style.textContent = "body { background: green }";
    }
    else if (message[1] == true) {
        console.log("changing blue");
        const style = document.getElementById("style-element");
        if (style.sheet.cssRules.length > 0) style.sheet.cssRules[0].style.backgroundColor = "blue";
        else style.textContent = "body { background: blue }";
    }
});
*/

// TODO: create list of views from storage

// document.querySelectorAll('ul.ember-view.filters > li:not(.filter-group-heading ~ li)');

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("button1").addEventListener("click", () => {
    chrome.storage.local.get(["css"], value => {
        const newValue = value.css.item1 == "list-item" ? "none" : "list-item";
        chrome.storage.local.set({ css: { item1: newValue } });
    });
    
  });

  document.getElementById("button2").addEventListener("click", () => {
    chrome.storage.local.set({ css: { item2: false } });
  });
});
