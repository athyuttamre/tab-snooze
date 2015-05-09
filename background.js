/**
 * Tab Snooze
 *
 * background.js
 * Athyuttam Reddy Eleti
 * @athyuttamre
 */

console.log("Welcome to background.js");
var snoozedTabs, settings;
init();


/**
 * Initializes the extension by getting already snoozed
 * tabs or starting a new list.
 */
function init() {
    console.log("background.js initializing...");

    // Load or set snoozedTabs
    snoozedTabs = getSnoozedTabs();
    if(!snoozedTabs) {
            snoozedTabs = {};
            snoozedTabs["tabCount"] = 0;
            setSnoozedTabs(snoozedTabs);
    }

    // Load or set settings
    settings = getSettings();
    if(!settings) {
        settings = {
            "start-day": "9:00 AM",
            "end-day": "6:00 PM",
            "start-weekend": "10:00 AM",
            "week-begin": 1,
            "weekend-begin": 6,
            "later-today": 3,
            "someday": 3,
            "open-new-tab": "true",
            "badge": "true"
        };
        setSettings(settings);
        localStorage.setItem("defaultSettings", JSON.stringify(settings));
    }

    // Set browserAction badge color
    chrome.browserAction.setBadgeBackgroundColor({color: "#FED23B"});
    updateBadgeText();

    // Set popper loop
    window.setInterval(popCheck, 10000);
}


/**
 * Snoozes a tab for later.
 * 
 * @param  {Tab} tab        A Tab object representing the current tab
 * @param  {int} popTime    Time object representing when the tab should resurface
 */
function snooze(tab, popTime) {
    // Get snoozed tabs
    snoozedTabs = getSnoozedTabs();

    // Remove tab
    chrome.tabs.remove(tab.id);

    // Add tab to snoozedTabs
    addSnoozedTab(tab, popTime);
}


/**
 * Checks every minute if there are tabs to be popped.
 */
function popCheck() {
    if(!navigator.onLine) {
        console.log("Offline, will popCheck later.");
        return;
    }

    clearAllNotifications();

    // Get snoozed tabs and settings
    snoozedTabs = getSnoozedTabs();
    settings = getSettings();

    console.log("in popCheck, settings:", settings);

    var timestamps = Object.keys(snoozedTabs).sort();

    // Collect tabs to be popped and their times
    var tabs = [];
    var times = [];

    for(var i = 0; i < timestamps.length - 1; i++) {
        var time = timestamps[i];
        var now = Date.now();
        
        if(time < now) {
            times.push(time);
            tabs = tabs.concat(snoozedTabs[time]);
        } else {
            break;
        }
    }

    if(tabs.length > 0) {
        // Show notification
        showNotification(tabs, function(id) {
            chrome.notifications.onButtonClicked.addListener(function(nid, buttonIndex) {
                // Pop tabs right now...
                if(nid == id && buttonIndex == 0) {
                    if(settings["open-new-tab"] == "true") {
                        chrome.windows.getCurrent(function(w) {
                            popTabs(tabs, times, w);
                        });
                    } else {
                        chrome.windows.create({}, function(w) {
                            popTabs(tabs, times, w);
                        });
                    }
                } 
                // ... or snooze them again
                else if(nid == id && buttonIndex == 1) {
                    console.log("Snoozed for later!");
                    for(var i = 0; i < tabs.length; i++) {
                        var tab = tabs[i];
                        console.log(tab);
                        var popTime = new Date(tab.popTime);
                        console.log("popTime", popTime);
                        popTime.setHours(popTime.getHours() + 1);
                        console.log("new time", popTime);
                        changeSnoozeTime(tabs[i], popTime);
                    }
                }
            });
        })
    }
}

/**
 * Shows the notification for the given tabs
 * @param  {Tab[]}   tabs       List of tabs waiting to be popped
 * @param  {Function} callback  Callback function called after notification is shown
 */
function showNotification(tabs, callback) {
    var tabCount = tabs.length;
    var message = "" + tabCount + ((tabCount > 1) ? " tabs are back" : " tab is back");

    chrome.notifications.create("", {
        type: "basic",
        priority: 1,
        title: "Tab Snooze",
        message: message,
        iconUrl: chrome.extension.getURL("assets/icons/browserAction.png"),
        buttons: [{
            title: "Open Now"
        }, {
            title: "Later"
        }]
    }, function(id) {
        callback(id);
    });
}

/**
 * Clears all notifications created by the extension.
 */
function clearAllNotifications() {
    chrome.notifications.getAll(function(notifications) {
        notifications = Object.keys(notifications);
        for(var i = 0; i < notifications.length; i++) {
            var id = notifications[i];
            chrome.notifications.clear(id, function() {
                
            });
        }
    });
}


/**
 * Pops tabs that were supposed to resurface at given time
 * @param  {String} timestamp   Timestamp of the tabs set
 */
function popTabs(tabs, times, w) {
    /* NOTE: Creating tabs is asynchronous; It's possible for them
    to fail and for us to delete the whole set from storage; FIX THIS. */

    // Create tabs in window
    for(var i = 0; i < tabs.length; i++) {
        createTab(tabs[i], w);
    }
    
    // Delete keys
    for(var i = 0; i < times.length; i++) {
        delete snoozedTabs[times[i]];
    }

    // Update tabCount
    snoozedTabs["tabCount"] -= tabs.length;

    // Set badge text
    updateBadgeText();

    // Update snoozed tabs
    setSnoozedTabs(snoozedTabs);
}


/**
 * Adds a tab to the stored list of snoozed tabs.
 * @param {Tab} tab         A Tab object representing the snoozed tab
 * @param {Time} popTime    A Time object representing when the tab should pop
 */
function addSnoozedTab(tab, popTime) {
    var fullTime = popTime.getTime();
    if(!snoozedTabs[fullTime]) {
        snoozedTabs[fullTime] = [];
    }

    // Add tab to snoozedTabs
    snoozedTabs[fullTime].push({
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl,
        creationTime: (new Date()),
        popTime: popTime
    });

    // Update tabCount
    snoozedTabs["tabCount"] += 1;

    // Set badge text
    updateBadgeText();

    // Update snoozedTabs
    setSnoozedTabs(snoozedTabs);
}


/**
 * Removes a tab from the given list of snoozed tabs.
 * @param  {Tab} tab            Tab object to be removed
 * @param  {Tab[]} snoozedTabs  The list of tabs the tab is removed from
 */
function removeSnoozedTab(tab, snoozedTabs) {
    var popTime = (new Date(tab.popTime)).getTime();
    var popSet = snoozedTabs[popTime];

    console.log(tab);
    console.log(popSet);

    // Search for tab
    var tabIndex = -1;
    for(var i = 0; i < popSet.length; i++) {
        if(popSet[i].creationTime == tab.creationTime) {
            tabIndex = i;
            break;
        }
    }

    if(tabIndex < 0) {
        console.log("Tab not found, returning");
        return;
    }
    
    // Update pop set
    popSet.splice(tabIndex, 1);

    if(popSet.length == 0) {
        delete snoozedTabs[popTime];
    } else {
        snoozedTabs[popTime] = popSet;
    }

    // Update tab count
    snoozedTabs["tabCount"] -= 1;
}


/**
 * Re-snoozes a tab to a new time
 * @param  {Tab} tab        Tab object which is to be re-snoozed
 * @param  {Date} newTime   Date object representing new snooze time
 */
function changeSnoozeTime(tab, newTime) {
    if(newTime == tab.popTime) {
        console.log("newTime same as oldTime, returning");
        return;
    }

    // Load snoozedTabs
    snoozedTabs = getSnoozedTabs();

    // Remove tab from old alarm set
    removeSnoozedTab(tab, snoozedTabs);

    // Add tab to new alarm set
    addSnoozedTab(tab, newTime);
}


/** 
 * Updates or hides the badge count of number of snoozed tabs.
 */
function updateBadgeText() {
    var snoozedTabs = getSnoozedTabs();
    var settings = getSettings();

    // If badge==false, don't show badge text
    if(settings["badge"] == "false") {
        chrome.browserAction.setBadgeText({text: ""});
        return;
    }

    if(!snoozedTabs) {
        return;
    }

    // Update badge text
    var snoozedCount = snoozedTabs["tabCount"];
    var countString = (snoozedCount > 0) ? snoozedCount.toString() : "";
    chrome.browserAction.setBadgeText({text: countString});
}

/**
 * Creates a new tab in the given window.
 * @param  {Tab} tab    Tab object representing the tab to be created
 * @param  {Window} w   Window in which the tab needs to be created
 */
function createTab(tab, w) {
    chrome.tabs.create({
        windowId: w.id,
        url: tab.url,
        active: false
    });
}

function getSnoozedTabs() {
    return JSON.parse(localStorage.getItem("snoozedTabs"));
}

function setSnoozedTabs(newSnoozedTabs) {
    localStorage.setItem("snoozedTabs", JSON.stringify(newSnoozedTabs));
}

function getSettings() {
    return JSON.parse(localStorage.getItem("settings"));
}

function setSettings(newSettings) {
    localStorage.setItem("settings", JSON.stringify(newSettings));
}