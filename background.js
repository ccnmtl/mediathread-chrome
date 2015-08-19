chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {file: 'lib/jquery-2.1.4.min.js'});
    chrome.tabs.executeScript(tab.id, {file: 'settings.js'});
    chrome.tabs.executeScript(tab.id, {file: 'collect.js'});
});
