chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {file: 'lib/jquery-2.1.4.min.js'});
    chrome.tabs.executeScript(tab.id, {file: 'lib/URI.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/settings.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/host-handler.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/asset-handler.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/collect.js'});
});
