chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {file: 'lib/jquery-1.11.3.min.js'});
    chrome.tabs.executeScript(tab.id, {file: 'settings.js'});
    chrome.tabs.executeScript(tab.id, {file: 'collect.js'});
});
