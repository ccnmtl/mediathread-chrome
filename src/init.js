$.ajax({
    url: MediathreadCollectOptions.user_url,
    dataType: 'json',
    crossDomain: true,
    cache: false,
    xhrFields: {
        withCredentials: true
    },
    success: function(d) {
        var hostUrl = MediathreadCollectOptions.host_url.replace(
                /\/save\/$/, '');
        if ('flickr_apikey' in d) {
            MediathreadCollect.options.flickr_apikey = d.flickr_apikey;
        }
        if ('youtube_apikey' in d) {
            MediathreadCollect.options.youtube_apikey = d.youtube_apikey;
        }

        if (d.logged_in === true && d.course_selected === true) {
            // Start the main plugin code
            MediathreadCollect.runners.jump(
                MediathreadCollectOptions.host_url, true);
        } else if (d.logged_in === true && d.course_selected === false) {
            alert(
                'You\'re logged in to Mediathread at ' +
                    hostUrl +
                    ', now select a course to use the Chrome extension.');
        } else {
            alert(
                'Log in to Mediathread here: ' + hostUrl +
                    ' and select a course!');
        }
    },
    error: function(d) {
        console.error('#', d);
    }
});
