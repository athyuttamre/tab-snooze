var snoozedTabs;
var bg = chrome.extension.getBackgroundPage();

$(document).ready(function() {
    console.log("Welcome to options.js");

    init();

    function init() {
        console.log("options.js is initializing...");
        snoozedTabs = JSON.parse(localStorage.getItem("snoozedTabs"));
        console.log("snoozedTabs from localStorage", snoozedTabs);

        // Set button click-handlers
        $(".nav-button").click(function(){
            var button = $(this);
            var buttonID = button.attr("id");
            var sectionName = buttonID.slice(0, -7);
            setSection(sectionName);
        });

        setupSnoozedTabs();
        setupLogs();
        setupSettings();
        setupAbout();
    }
});

function setupSnoozedTabs() {
    // List snoozed tabs
    listSnoozedTabs();

    // Set Clear-All Button
    if(snoozedTabs["tabCount"] == 0) {
        $("#clear-all").prop('disabled', true);
    } else {
        $("#clear-all").click(function() {
            clearAll();
        });
    }
}

function setupLogs() {

}

function setupSettings() {

}

function setupAbout() {

}

function setSection(sectionName) {
    var button = $("#" + sectionName + "-button");
    var buttonListItem = button.parent();
    var section = $("#" + sectionName);

    // Set button
    $("#navigation li").removeClass("selected");
    buttonListItem.addClass("selected");

    // Set section
    $(".options-section").removeClass("selected");
    section.addClass("selected");
}

function listSnoozedTabs() {
    var alarmTimes = Object.keys(snoozedTabs).sort();
    console.log("alarmTimes", alarmTimes);

    for(var i = 0; i < alarmTimes.length; i++) {
        var alarmTime = alarmTimes[i];
        var alarmSet = snoozedTabs[alarmTime];

        for(var j = 0; j < alarmSet.length; j++) {
            var tab = alarmSet[j];
            listTab(tab);
        }
    }
}

function listTab(tab) {
    console.log("tab", tab);

    var ol = $("#tabs-list-container ol");

    var entry = $(document.createElement('li'))
    entry.addClass("entry");
    entry.attr("url", tab.url);
    entry.attr("creationTime", tab.creationTime);

    var time = $(document.createElement('time'));
    time.addClass("entry-time");
    time.text(formatTime(tab.alarmTime));

    var favicon = $(document.createElement('span'));
    favicon.addClass("entry-favicon");
    if(tab.favicon) {
        favicon.css("background-image", "url(\"" + tab.favicon +"\")");
    }

    var title = $(document.createElement('a'));
    title.addClass("entry-title");
    title.attr("href", tab.url);
    title.text(tab.title);

    var domain = $(document.createElement('span'));
    domain.addClass("entry-domain");
    var location = document.createElement('a');
    location.href = tab.url;
    domain.text(location.hostname);

    var clear = $(document.createElement('button'));
    clear.addClass("entry-clear custom-appearance");
    clear.attr("title", "Clear Tab");

    clear.click(function(tab, entry) {
        return function() {
            clearEntry(tab, entry);
        }
    }(tab, entry));

    entry.append([time, favicon, title, domain, clear]);

    ol.append(entry);
}

function formatTime(alarmTime) {
    var time = new Date(alarmTime);
    console.log(time);

    var hours = time.getHours() % 12;
    var minutes = time.getMinutes();
    if(minutes < 10) {
        minutes = "0" + minutes;
    }

    var ampm = (time.getHours() < 12) ? "AM" : "PM";

    return ("" + hours + ":" + minutes + " " + ampm);
}

function clearAll() {
    var tabCount = snoozedTabs["tabCount"];
    if(tabCount <= 0) {
        return;
    }

    var canClear = confirm("Are you sure you want to clear all " + tabCount + " tabs?");
    if(canClear) {
        snoozedTabs = {};
        snoozedTabs["tabCount"] = 0;
        bg.setSnoozedTabs(snoozedTabs);
        bg.updateBadgeText(snoozedTabs);

        $(".entry").fadeOut(function() {
            $(this).slideUp(function() {
                $(this).remove();
            });
        });

        $("#clear-all").prop('disabled', true);
    }
}

function clearEntry(tab, entry) {
    console.log("About to clear tab", tab);

    bg.removeSnoozedTab(tab, snoozedTabs);
    bg.setSnoozedTabs(snoozedTabs);
    bg.updateBadgeText(snoozedTabs);

    entry.fadeOut(function() {
        $(this).slideUp(function() {
            $(this).remove();
        });
    });

    if(snoozedTabs["tabCount"] == 0) {
        $("#clear-all").prop('disabled', true);
    }
}