$(document).ready(function() {
    console.log("Welcome to popup.js\nAll log messages (not errors!) will be printed to the background page's console.\nGoodbye!");
    var bg = chrome.extension.getBackgroundPage();
    window.console = bg.console;
    init();

    function init() {
        console.log("\npopup.js initializing...");

        // Set up button click-handlers
        $("#snooze-buttons button").click(function() {
            var time = getTime($(this).attr("id"));
            snoozeCurrentTab(time);
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

        var result; 

        // Calculate wake-up time
        switch(timeName) {
            case "ten-seconds":
                result = new Date(Date.now() + 10 * second);
                break;
            case "later-today":
                result = new Date(roundedNow.getTime() + 3 * hour);
                break;
            case "this-evening":
                result = new Date();
                result.setHours(18, 0, 0, 0); // 6:00:00:00 PM
                break;
            case "tomorrow":
                result = new Date();
                result.setDate(result.getDate() + 1); // Automatically updates months
                result.setHours(9, 0, 0, 0); // 9:00:00:00 AM
                break;
            default:
                // TO-DO: Fill out rest here
                result = new Date();
        }

        console.log("result", result);
        return result;
    }
});

