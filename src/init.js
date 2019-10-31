/* eslint-env jquery */
/* global MediathreadCollect, chrome, Promise */

/**
 * Returns a promise yielding the host url stored in the extension's
 * settings.
 */
var getHostUrl = function() {
    return new Promise(function(fulfill) {
        var defaultHostUrl = 'https://mediathread.ctl.columbia.edu/';
        try {
            chrome.storage.sync.get('options', function(data) {
                if (data.options) {
                    if (data.options.hostUrl === 'other') {
                        fulfill(data.options.customUrl);
                    } else {
                        fulfill(data.options.hostUrl);
                    }
                } else {
                    fulfill(defaultHostUrl);
                }
            });
        } catch (e) {
            // If anything fails, just return the default hardcoded
            // host url.
            fulfill(defaultHostUrl);
        }
    });
};

getHostUrl().then(function(hostUrl) {
    chrome.runtime.sendMessage({
        contentScriptQuery: 'getContent',
        hostUrl: hostUrl,
        mediathreadCollect: MediathreadCollect
    }, function(data) {
        if ('flickr_apikey' in data) {
            MediathreadCollect.options.flickr_apikey = data.flickr_apikey;
        }
        if ('youtube_apikey' in data) {
            MediathreadCollect.options.youtube_apikey = data.youtube_apikey;
        }

        if (data.logged_in === true && data.course_selected === true) {
            // Start the main plugin code
            MediathreadCollect.runners.jump(hostUrl, true);
        } else if (data.logged_in === true && data.course_selected === false) {
            alert(
                'You\'re logged in to Mediathread at ' +
                    hostUrl +
                    ', now select a course to use the Chrome extension.');
        } else {
            alert(
                'Log in to Mediathread at ' + hostUrl +
                    ' and select a course!');
        }
    });
});
