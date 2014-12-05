$(document).ready(function() {
    console.log("Welcome to popup.js\nAll log messages (not errors!) will be printed to the background page's console.\nGoodbye!");
    var bg = chrome.extension.getBackgroundPage();
    window.console = bg.console;
    init();

    function init() {
        console.log("\npopup.js initializing...");

        // Set up status text
        var snoozedTabs = bg.getSnoozedTabs();
        var tabCount = snoozedTabs["tabCount"];
        if(tabCount > 0) {
            var button = $(document.createElement('button'));
            button.click(function() {
                console.log("status button clicked");
                window.open(chrome.extension.getURL("options/index.html#snoozed-tabs"));
            });
            button.text("" + tabCount + " Snoozed Tabs");
            $("#default-status").html(button);
        }

        // Set up button click-handlers
        $("#snooze-buttons button").click(function() {
            var time = getTime($(this).attr("id"));
            snoozeCurrentTab(time);
        });

        $("#settings").click(function() {
            console.log("options clicked");
            window.open(chrome.extension.getURL("options/index.html#settings"));
        });
    }

    function snoozeCurrentTab(time) {
        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            console.log("tabs: ", tabs);
            bg.snooze(tabs[0], time);
        });
    }

    function getTime(timeName) {
        console.log("timeName", timeName);
        console.log("now", new Date());

        // Get rounded time
        var roundedNow = new Date();
        roundedNow.setSeconds(0, 0); // Round date to minutes
        console.log("roundedNow", roundedNow);

        var second = 1000;
        var minute = second * 60;
        var hour = minute * 60;
        var day = hour * 24;

        var result = new Date();

        // Calculate wake-up time
        switch(timeName) {
            case "ten-seconds":
                result = new Date(Date.now() + 10 * second);
                break;
            case "later-today":
                result = new Date(roundedNow.getTime() + 3 * hour);
                break;
            case "this-evening":
                /* NOTE: Fix for when time is past 6 PM */
                result.setHours(18, 0, 0, 0); // 6:00:00:00 PM
                break;
            case "tomorrow":
                result.setDate(result.getDate() + 1); // Automatically updates months
                result.setHours(9, 0, 0, 0); // 9:00:00:00 AM
                break;
            case "this-weekend":
                var daysToSaturday = 6 - result.getDay();
                result.setDate(result.getDate() + daysToSaturday);
                result.setHours(9, 0, 0, 0);
                break;
            case "next-week":
                var daysToMonday = (7 % result.getDay() - 1);
                if(isNaN(daysToMonday)) {
                    daysToMonday = 0;
                } else if(daysToMonday == 0) {
                    daysToMonday = 1; /* Today is Sunday */
                }

                result.setDate(result.getDate() + daysToMonday);
                result.setHours(9, 0, 0, 0);
                break;
            case "in-a-month":
                result.setMonth(result.getMonth() + 1);
                break;
            case "someday":
                result.setMonth(result.getMonth() + 3);
                break;
            case "pick-date":
                alert("Picking date is not yet available, sorry!");
                break;
            default:
                result = new Date();
        }

        console.log("result", result);
        return result;
    }
});

