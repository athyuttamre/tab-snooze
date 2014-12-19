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
 * Initializes the extension by getting already snoozed
 * tabs or starting a new list.
 */
function init() {
    console.log("background.js initializing...");

    // Load or set snoozedTabs
    var currentTabs = getSnoozedTabs();
    if(!currentTabs) {
            currentTabs = {};
            currentTabs["tabCount"] = 0;
            localStorage.setItem("snoozedTabs", JSON.stringify(currentTabs));
    }

    // Load or set settings
    var settings = getSettings();
    if(!settings) {
        settings = {
            "start-day": "9:00 AM",
            "end-day": "6:00 PM",
            "start-weekend": "10:00 AM",
            "week-begin": 1,
            "weekend-begin": 6,
            "later-today": 3,
            "someday": 3,
            "badge": true,
						"here": true
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

function popCheck() {
    console.log("popChecking...");

    var snoozedTabs = getSnoozedTabs();
    console.log("Loaded from localStorage", snoozedTabs);

    var timestamps = Object.keys(snoozedTabs).sort();
    console.log("timestamps", timestamps);

    for(var i = 0; i < timestamps.length - 1; i++) {
        console.log("checking", timestamps[i]);
        var now = Date.now();
        if(timestamps[i] < now) {
            popTabs(timestamps[i], snoozedTabs);
        } else {
            break;
        }
    }
}

/**
 * Pops tabs that were supposed to resurface at given time
 * @param  {String} timestamp   Timestamp of the tabs set
 */
function popTabs(timestamp, snoozedTabs) {
	console.log("\npopTabs went off!", timestamp);
	alert("Popping tabs!");

	/* NOTE: Use notifications instead of alerts */

	// Get tabs to be resurfaced
	var tabs = snoozedTabs[timestamp];

	// Create window for resurfaced tabs
	var newWindow;

	var settings = getSettings();
	
	console.log(settings);

	if(settings.here) {

		chrome.windows.getCurrent(function(w){
			newWindow = w;
			// Create tabs in newWindow
			for(var i = 0; i < tabs.length; i++) {
				createTab(tabs[i], newWindow);
			}

			// Delete key and update tabCount
			delete snoozedTabs[timestamp];
			snoozedTabs["tabCount"] -= tabs.length;

			// Set badge text
			updateBadgeText();

			// Update snoozed tabs
			setSnoozedTabs(snoozedTabs);

		});

	} else {

		chrome.windows.create({
			focused: false
		}, function(w) {
			newWindow = w;

			// Create tabs in newWindow
			for(var i = 0; i < tabs.length; i++) {
				createTab(tabs[i], newWindow);
			}

			/* NOTE: Creating tabs is asynchronous; It's possible for them
				 to fail and for us to delete the whole set from storage; FIX THIS. */

			// Delete key and update tabCount
			delete snoozedTabs[timestamp];
			snoozedTabs["tabCount"] -= tabs.length;

			// Set badge text
			updateBadgeText();

			// Update snoozed tabs
			setSnoozedTabs(snoozedTabs);
		});
	}

}

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

function getSettings() {
    return JSON.parse(localStorage.getItem("settings"));
}

function setSettings(newSettings) {
		console.log(newSettings);
    localStorage.setItem("settings", JSON.stringify(newSettings));
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
    snoozedTabs["tabCount"] += 1;

    // Set badge text
    updateBadgeText();

    // Update snoozedTabs
    setSnoozedTabs(snoozedTabs);
}

function removeSnoozedTab(tab, snoozedTabs) {
    console.log("removeSnoozedTab called");
    console.log(tab);
    console.log(snoozedTabs);
    var alarmTime = (new Date(tab.alarmTime)).getTime();
    var alarmSet = snoozedTabs[alarmTime];
    console.log("alarmSet", alarmSet);

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

    if(alarmSet.length == 0) {
        delete snoozedTabs[alarmTime];
    } else {
        snoozedTabs[alarmTime] = alarmSet;
    }

    snoozedTabs["tabCount"] -= 1;
}

function createTab(tab, w) {
    chrome.tabs.create({
        windowId: w.id,
        url: tab.url,
        active: false
    });
}

function updateBadgeText() {
    var snoozedTabs = getSnoozedTabs();
    console.log("Updating badge text...");
    console.log(snoozedTabs);

    var settings = getSettings();
    var badgeSetting = settings["badge"];
    console.log("badgeSetting", badgeSetting);
    if(badgeSetting === "false") {
        console.log("badge set to false");
        chrome.browserAction.setBadgeText({text: ""});
        return;
    }

    if(!snoozedTabs) {
        return;
    }

    var snoozedCount = snoozedTabs["tabCount"];
    console.log("snoozedCount", snoozedCount);
    var countString = (snoozedCount > 0) ? snoozedCount.toString() : "";

    chrome.browserAction.setBadgeText({text: countString});
}
