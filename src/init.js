/* eslint-env jquery */
/* global MediathreadCollect, chrome, Promise */

/**
 * Returns a promise yielding the host url stored in the extension's
 * settings.
 */
var getHostUrl = function() {
    return new Promise(function(fulfill) {
        var defaultHostUrl = 'https://mediathread.ccnmtl.columbia.edu/';
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
    var isLoggedInUrl = hostUrl + '/accounts/is_logged_in/';
    $.ajax({
        url: isLoggedInUrl,
        dataType: 'json',
        crossDomain: true,
        cache: false,
        xhrFields: {
            withCredentials: true
        },
        success: function(d) {
            if ('flickr_apikey' in d) {
                MediathreadCollect.options.flickr_apikey = d.flickr_apikey;
            }
            if ('youtube_apikey' in d) {
                MediathreadCollect.options.youtube_apikey = d.youtube_apikey;
            }

            if (d.logged_in === true && d.course_selected === true) {
                // Start the main plugin code
                MediathreadCollect.runners.jump(hostUrl, true);
            } else if (d.logged_in === true && d.course_selected === false) {
                alert(
                    'You\'re logged in to Mediathread at ' +
                        hostUrl +
                        ', now select a course to use the Chrome extension.');
            } else {
                alert(
                    'Log in to Mediathread at ' + hostUrl +
                        ' and select a course!');
            }
        },
        error: function() {
            alert('Error loading URL: ' + isLoggedInUrl);
        }
    });
});
