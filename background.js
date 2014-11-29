/**
 * Tab Snooze
 *
 * background.js
 * Athyuttam Reddy Eleti
 * @athyuttamre
 */

console.log("Welcome to background.js");
var snoozedTabs = {};
init();

/**
 * Initializes the extension by loading
 * previously snoozed tabs.
 */
function init() {
    getSnoozedTabs();
}

/**
 * Snoozes a tab for later.
 * 
 * @param  {Tab} tab     A Tab object representing the current tab
 * @param  {int} seconds Time in seconds for which the tab is snoozed
 */
function snooze(tab, alarmTime) {
    console.log("\nsnooze called...");
    // Update snoozed tabs
    getSnoozedTabs(function() {
        console.log("Called back in snooze", snoozedTabs);
        // Remove tab
        chrome.tabs.remove(tab.id, function() {
            console.log("removed tab " + tab.url);
        });

        snoozedTabs[tab.url] = {
            url: tab.url,
            title: tab.title,
            favicon: tab.favIconUrl,
            alarmTime: alarmTime
        }

        console.log("Added tab", snoozedTabs);

        // Set alarm
        chrome.alarms.create(tab.url, {when: alarmTime.getTime()});

        // Set badge text
        updateBadgeText();

        // Update snoozedTabs
        setSnoozedTabs();
    });
}

/**
 * Resurfaces the tab when its alarm goes off.
 * @param  {Alarm} alarm    Alarm object continaing the name and time
 */
chrome.alarms.onAlarm.addListener(function(alarm) {
    console.log("\nAlarm went off!", alarm);
    alert("Alarm went off!" + alarm.name);
    // Update snoozed tabs
    getSnoozedTabs(function() {
        console.log("Called back in popper", snoozedTabs);
        // Get tab to be resurfaced
        var tab = snoozedTabs[alarm.name];

        // Create window and open tab
        chrome.windows.create({
            focused: false
        }, function(window) {
            createTab(tab, window);
        });
        
        // Delete key
        delete snoozedTabs[tab.url];

        // Update snoozed tabs and badge text
        setSnoozedTabs();
        updateBadgeText();
    });
});

function createTab(tab, window) {
    chrome.tabs.create({
        windowId: window.id,
        url: tab.url,
        active: false
    });
}

function getSnoozedTabs(callback) {
    chrome.storage.sync.get(snoozedTabs, function(storedSnoozedTabs) {
        console.log("Got snoozedTabs from ", storedSnoozedTabs);
        snoozedTabs = storedSnoozedTabs;
        if(callback) {
            callback();
        }
    });
}

function setSnoozedTabs(callback) {
    chrome.storage.sync.set(snoozedTabs, function() {
        console.log("Set snoozedTabs to", snoozedTabs);
        if(callback) {
            callback();
        }
    });
}

function updateBadgeText() {
    console.log("Updating badge text...");
    var snoozedCount = Object.keys(snoozedTabs).length;
    var countString = (snoozedCount > 0) ? snoozedCount.toString() : "";

    chrome.browserAction.setBadgeText({text: countString});
    chrome.browserAction.setBadgeBackgroundColor({color: "#FED23B"});
}