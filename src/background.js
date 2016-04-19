chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if (
            request.command &&
                request.command === 'updatesettings' &&
                sender.url.startsWith('https://')
        ) {
            var url = sender.url;
            url = url.replace(/#$/, '');
            url = url.replace(/\/$/, '');
            chrome.storage.sync.set({
                options: {
                    hostUrl: 'other',
                    customUrl: url
                }
            }, function optionsSaved() {
                sendResponse('Mediathread URL updated to: ' + url);
            });
        }
        return true;
    });

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {file: 'lib/jquery-2.2.0.min.js'});
    chrome.tabs.executeScript(tab.id, {file: 'lib/URI.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/loadcss.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/collect-popup.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/common/host-handler.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/common/asset-handler.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/common/collect.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/init.js'});
});
