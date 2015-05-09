var snoozedTabs;
var settings;
var bg = chrome.extension.getBackgroundPage();

$(document).ready(function() {
    console.log("Welcome to options.js");

    init();

    function init() {
        console.log("options.js is initializing...");
        snoozedTabs = bg.getSnoozedTabs();
        console.log("snoozedTabs from localStorage", snoozedTabs);
        settings = bg.getSettings();
        console.log("settings from localStorage", settings);

        // Set button click-handlers
        $(".nav-button").click(function(){
            var button = $(this);
            var buttonID = button.attr("id");
            var sectionName = buttonID.slice(0, -7);
            setSection("#" + sectionName);
        });

        setupSnoozedTabs();
        setupSettings();
        setupAbout();

        var startSection = window.location.hash;
        if(!startSection) {
            startSection = "#snoozed-tabs";
        }

        setSection(startSection);

        // Listen to changes to localStorage and update views
        $(window).bind("storage", function() {
            snoozedTabs = bg.getSnoozedTabs();
            settings = bg.getSettings();
            listSnoozedTabs();
            renderSettings();
        });
    }
});

function setupSnoozedTabs() {
    // List snoozed tabs
    listSnoozedTabs();

    // Set Clear-All and Export Button
    if(snoozedTabs["tabCount"] == 0) {
        $("#clear-all").prop('disabled', true);
        $("#export-tabs").prop('disabled', true);
    } else {
        $("#clear-all").click(function() {
            clearAll();
        });

        $("#export-tabs").click(function() {
            exportTabs();    
        });
    }
}

function setupSettings() {
    $("#reset-settings").click(function() {
        resetSettings();
    });

    $('#start-day-timepicker').timepicker({
        template: false,
        showInputs: false,
        minuteStep: 30,
        defaultTime: settings["start-day"]
    });

    $('#end-day-timepicker').timepicker({
        template: false,
        showInputs: false,
        minuteStep: 30,
        defaultTime: settings["end-day"]
    });

    $('#start-weekend-timepicker').timepicker({
        template: false,
        showInputs: false,
        minuteStep: 30,
        defaultTime: settings["start-weekend"]
    });

    renderSettings();

    $(".bootstrap-timepicker input").on("changeTime.timepicker", function(e) {
        var id = $(this).attr("id");
        var setting = id.substring(0, id.length - 11);
        var time = e.time.value;

        console.log("" + setting + " = " + time);
        settings[setting] = time;
        bg.setSettings(settings);
    });

    $("select.control").change(function(e){
        var setting = $(this).attr("id");
        var value = parseInt($(this).val());
        console.log("Setting " + setting + " to " + value);

        settings[setting] = value;
        bg.setSettings(settings);
    });

    $("input[name='badge']").change(function(){
        var badgeVal = $(this).val();
        console.log("Setting badge to " + badgeVal);

        settings["badge"] = badgeVal;
        bg.setSettings(settings);
        bg.updateBadgeText();
    });

    $("input[name='open-new-tab']").change(function(){
        var openVal = $(this).val();
        console.log("Open in new tab?", openVal);

        settings["open-new-tab"] = openVal;
        bg.setSettings(settings);
    });
}

function renderSettings() {
    $("#start-day-timepicker").timepicker("setTime", settings["start-day"]);
    $("#end-day-timepicker").timepicker("setTime", settings["end-day"]);
    $("#start-weekend-timepicker").timepicker("setTime", settings["start-weekend"]);

    $("#week-begin").val(settings["week-begin"]);
    $("#weekend-begin").val(settings["weekend-begin"]);
    $("#later-today").val(settings["later-today"]);
    $("#someday").val(settings["someday"]);

    $("input[name='badge']").val([settings["badge"]]);
    bg.updateBadgeText();

    $("input[name='open-new-tab']").val([settings["open-new-tab"]]);
}

function setupAbout() {

}

function setSection(sectionID) {
    var button = $(sectionID + "-button");
    var buttonListItem = button.parent();
    var section = $(sectionID);

    // Set button
    $("#navigation li").removeClass("selected");
    buttonListItem.addClass("selected");

    // Set section
    $(".options-section").hide();
    section.fadeIn();

    // Set page hash
    window.location.hash = sectionID;
}

function listSnoozedTabs() {
    $("#days-list").empty();

    if(snoozedTabs["tabCount"] == 0) {
        $(".no-tabs").fadeIn();
        return;
    } else {
        $(".no-tabs").hide();
    }

    var popTimes = Object.keys(snoozedTabs).sort();
    console.log("popTimes", popTimes);

    for(var i = 0; i < popTimes.length - 1; i++) {
        var popTime = popTimes[i];
        var alarmSet = snoozedTabs[popTime];

        var day = (new Date(parseInt(popTime)));
        day.setHours(0, 0, 0, 0);

        var dayHeading = $("#day-" + day.getTime());
        if(dayHeading.length == 0) {
            listDay(day);
        }

        for(var j = 0; j < alarmSet.length; j++) {
            var tab = alarmSet[j];
            listTab(tab, day);
        }
    }
}

function listDay(day) {
    var dayLi = $(document.createElement('li'));

    var dayHeading = $(document.createElement('h3'));
    dayHeading.addClass("day-heading");
    dayHeading.text(formatDay(day));

    var dayTabsList = $(document.createElement('ol'));
    dayTabsList.attr("id", "day-" + day.getTime());
    dayTabsList.addClass("day-tabs-list");

    dayLi.append([dayHeading, dayTabsList]);

    $("#days-list").append(dayLi);
}

function listTab(tab, day) {
    console.log("tab", tab);

    var ol = $("#day-" + day.getTime());

    var entry = $(document.createElement('li'))
    entry.addClass("entry");
    entry.attr("url", tab.url);
    entry.attr("creationTime", tab.creationTime);

    var time = $(document.createElement('time'));
    time.addClass("entry-time");
    time.text(formatTime(tab.popTime));

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

function formatDay(day) {
    var result = "";

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if(day.getTime() == tomorrow.getTime()) {
        result += "Tomorrow — ";
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if(day.getTime() == today.getTime()) {
        result += "Today — ";
    }

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    if(day.getTime() == yesterday.getTime()) {
        result += "Yesterday — ";
    }

    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", 
                    "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May",
                "June", "July", "August", "September", "October",
                "November", "December"];

    var weekday = weekdays[day.getDay()];
    var month = months[day.getMonth()];

    result += weekday + ", " + month + " " + day.getDate() + ", " + day.getFullYear();
    return result;
}

function formatTime(popTime) {
    var time = new Date(popTime);
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

    var confirmText = "Are you sure you want to clear ";
    if(tabCount == 1) {
        confirmText += "1 tab?";
    } else {
        confirmText += "all " + tabCount + " tabs?";
    }
    var canClear = confirm(confirmText);
    if(canClear) {
        snoozedTabs = {};
        snoozedTabs["tabCount"] = 0;
        bg.setSnoozedTabs(snoozedTabs);
        bg.updateBadgeText();

        $("#days-list li").fadeOut(function() {
            $(this).remove();
        });

        $("#clear-all").prop('disabled', true);
        $("#export-tabs").prop('disabled', true);
    }
}

function clearEntry(tab, entry) {
    console.log("About to clear tab", tab);

    bg.removeSnoozedTab(tab, snoozedTabs);
    bg.setSnoozedTabs(snoozedTabs);
    bg.updateBadgeText();

    var dayList = entry.parent();
    var dayLi = dayList.parent();

    console.log(dayList);
    console.log(dayLi);
    console.log(dayList.children().length);

    if(dayList.children().length == 1) {
        dayLi.fadeOut(function() {
            console.log($(this));
            $(this).remove();
        });
    } else {
        entry.fadeOut(function() {
            $(this).slideUp(function() {
                $(this).remove();
            });
        });
    }

    if(snoozedTabs["tabCount"] == 0) {
        $("#clear-all").prop('disabled', true);
        $("#export-tabs").prop('disabled', true);
    }
}

function resetSettings() {
    var canReset = confirm("Are you sure you want to reset all settings?");
    if(!canReset) {
        return;
    }

    settings = JSON.parse(localStorage.getItem("defaultSettings"));
    bg.setSettings(settings);

    console.log("rendering");
    renderSettings();
}

function exportTabs() {
    window.URL = window.URL || window.webkitURL;

    var now = new Date();
    dateString = "" + now.getFullYear() + now.getMonth() + now.getDate() + "-" + now.getHours() + now.getMinutes();

    var exportObject = {
        exportTime: now.getTime(),
        settings: settings,
        snoozedTabs: snoozedTabs
    }

    var blob = new Blob([JSON.stringify(exportObject, undefined, 2)], {type: 'text/plain'});
    var blobURL = window.URL.createObjectURL(blob);

    chrome.downloads.download({
        url: blobURL,
        filename: "tabsnooze-" + dateString + ".json",
        saveAs: true
    });
}

function errorHandler(e) {
    console.log("errorHandler called!", e);
}