$(document).ready(function() {
    console.log("Welcome to options.js");
    var bg = chrome.extension.getBackgroundPage();
    var snoozedTabs;

    init();

    function init() {
        console.log("options.js is initializing...");
        snoozedTabs = JSON.parse(localStorage.getItem("snoozedTabs"));
        console.log("snoozedTabs from localStorage", snoozedTabs);
    }
});