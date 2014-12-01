/**
 * Tab Snooze
 *
 * background.js
 * Athyuttam Reddy Eleti
 * @athyuttamre
 */

console.log("Welcome to background.js");
init();

/**
 * Initializes the extension by loading
 * previously snoozed tabs.
 */
function init() {
    console.log("background.js initializing...");
    localStorage.setItem("snoozedTabs", JSON.stringify({}));
    chrome.browserAction.setBadgeBackgroundColor({color: "#FED23B"});
}

/**
 * Snoozes a tab for later.
 * 
 * @param  {Tab} tab        A Tab object representing the current tab
 * @param  {int} alarmTime  Time object representing when the tab should resurface
 */
function snooze(tab, alarmTime) {
    console.log("\nsnooze called...");
    // Get snoozed tabs
    
    var snoozedTabs = getSnoozedTabs();
    console.log("Loaded from localStorage", snoozedTabs);

    // Remove tab
    chrome.tabs.remove(tab.id, function() {
        console.log("Removed tab " + tab.url);
    });

    // Add tab to snoozedTabs
    addSnoozedTab(tab, alarmTime, snoozedTabs);
}

/**
 * Resurfaces the tab when its alarm goes off.
 * @param  {Alarm} alarm    Alarm object continaing the name and time
 */
chrome.alarms.onAlarm.addListener(function(alarm) {
    console.log("\nAlarm went off!", alarm);
    alert("Alarm went off!" + alarm.name);

    var snoozedTabs = getSnoozedTabs();
    console.log("Loaded from localStorage", snoozedTabs);

    // Get tabs to be resurfaced
    var tabs = snoozedTabs[alarm.scheduledTime];

    // Save current window so we can keep focus
    var currentWindow;
    chrome.windows.getCurrent(function(w) {
        console.log("Got current window", w);
        currentWindow = w;

        // Create window for resurfaced tabs
        var newWindow;
        chrome.windows.create({
            focused: false
        }, function(w) {
            newWindow = w;

            // Create tabs in newWindow
            for(var i = 0; i < tabs.length; i++) {
                createTab(tabs[i], newWindow);
            }

            // Refocus old window
            chrome.windows.update(currentWindow.id, {focused: true}, function() {
                console.log("Refocused old window!");

                /* NOTE: Creating tabs is asynchronous; It's possible for them
                to fail and for us to delete the whole set from storage; FIX THIS. */
                
                // Delete key
                delete snoozedTabs[alarm.scheduledTime];

                // Set badge text
                updateBadgeText(snoozedTabs);

                // Update snoozed tabs
                setSnoozedTabs(snoozedTabs);
            });
        });
    });
});

function changeSnoozeTime(tab, newTime) {
    if(newTime == tab.alarmTime) {
        console.log("newTime same as oldTime, returning");
        return;
    }

    var snoozedTabs = getSnoozedTabs();

    // Remove tab from old alarm set
    removeSnoozedTab(tab, snoozedTabs);

    // Add tab to new alarm set
    addTab(tab, newTime, snoozedTabs);
}

function getSnoozedTabs() {
    return JSON.parse(localStorage.getItem("snoozedTabs"));
}

function setSnoozedTabs(newSnoozedTabs) {
    localStorage.setItem("snoozedTabs", JSON.stringify(newSnoozedTabs));
}

function addSnoozedTab(tab, alarmTime, snoozedTabs) {
    var fullTime = alarmTime.getTime();
    if(!snoozedTabs[fullTime]) {
        snoozedTabs[fullTime] = [];
    }

    snoozedTabs[fullTime].push({
        type: "tab",
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl,
        creationTime: (new Date()),
        alarmTime: alarmTime
    });

    console.log("Added tab", snoozedTabs);

    // Set alarm
    chrome.alarms.create({when: fullTime});

    // Set badge text
    updateBadgeText(snoozedTabs);

    // Update snoozedTabs
    setSnoozedTabs(snoozedTabs);
}

function removeSnoozedTab(tab, snoozedTabs) {
    var alarmTime = tab.alarmTime;
    var alarmSet = snoozedTabs[alarmTime];

    // Search for tab
    var tabIndex = alarmSet.indexOf(tab);
    if(tabIndex < 0) {
        console.log("Tab not found, returning");
        return;
    }
    
    // Update old alarm set
    alarmSet.splice(tabIndex, 1);
    if(alarmSet.length == 0) {
        delete snoozedTabs[alarmTime];
    }

    snoozedTabs[alarmTime] = alarmSet;
}

function createTab(tab, w) {
    chrome.tabs.create({
        windowId: w.id,
        url: tab.url,
        active: false
    });
}

function updateBadgeText(snoozedTabs) {
    console.log("Updating badge text...");
    var snoozedCount = Object.keys(snoozedTabs).length;
    var countString = (snoozedCount > 0) ? snoozedCount.toString() : "";

    chrome.browserAction.setBadgeText({text: countString});
}