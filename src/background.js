/* globals chrome, $ */

var getPathFromUrl = function(url) {
    return url.split(/[?#]/)[0];
};

// https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.contentScriptQuery == 'getContent') {
            var isLoggedInUrl = new URL('/accounts/is_logged_in/', request.hostUrl);

            fetch(isLoggedInUrl, {
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    sendResponse(data);
                    return data;
                })
                .catch(function() {
                    alert('Error loading URL: ' + isLoggedInUrl.href);
                });
            return true;  // Will respond asynchronously.
        } else if (request.contentScriptQuery === 'getYoutubeAsset') {
            // gapi will be a string that includes the id, like
            // https://www.googleapis.com/youtube/v3/videos?id=Tu42VMSZV8o
            var url = request.ytApiUrl + '&' + $.param(request.urlParams);

            fetch(url, {
                cache: 'no-cache',
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    sendResponse(data);
                    return data;
                })
                .catch(function() {
                    alert('Error loading YouTube URL: ' + url);
                });
            return true;
        }
    });

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if (request.command && request.command === 'updatesettings') {
            if (!sender.url.startsWith('https://')) {
                sendResponse('This extension requires Mediathread to be ' +
                             'used over HTTPS.');
                return false;
            }

            var url = sender.url;
            url = getPathFromUrl(url);
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
    chrome.tabs.executeScript(tab.id, {file: 'lib/jquery-3.4.1.min.js'});
    chrome.tabs.executeScript(tab.id, {file: 'lib/URI.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/loadcss.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/collect-popup.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/common/host-handler.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/common/asset-handler.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/common/collect.js'});
    chrome.tabs.executeScript(tab.id, {file: 'src/init.js'});
});
