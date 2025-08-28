/* globals chrome */

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

            var url = new URL(sender.url);
            var newUrl = url.origin;
            chrome.storage.sync.set({
                options: {
                    hostUrl: 'other',
                    customUrl: newUrl
                }
            }, function optionsSaved() {
                sendResponse('The extension will now collect to: ' + newUrl);
            });
        }
        return true;
    });

chrome.action.onClicked.addListener(function(tab) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
            'lib/jquery-3.7.1.min.js',
            'lib/URI.js',
            'src/loadcss.js',
            'src/collect-popup.js',
            'src/common/host-handler.js',
            'src/common/asset-handler.js',
            'src/common/collect.js',
            'src/init.js'
        ]
    });
});
