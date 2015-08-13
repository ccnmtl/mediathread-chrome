/*
 * NOTE: This file isn't currently in use for this extension.
 * This is just here for reference purposes - it's an unminified
 * version of the bookmarklet loader from mediathread, since it
 * was hard to understand what was going on with that code.
 */
(function(host, bookmarklet_url, user_url) {
    var b = document.body;
    var sb = window.SherdBookmarkletOptions;
    if (!sb) {
        sb = window.SherdBookmarkletOptions = {};
        sb.action = 'jump';
    }

    sb.host_url = 'https://' + host + '/save/?';
    sb.flickr_apikey = 'undefined';

    var r4 = function() {
        return '&nocache=' + Number(new Date());
    };

    if (b) {
        var x = document.createElement('script');
        x.src = 'https://' + host + user_url + r4();
        b.appendChild(x);
        var z = document.createElement('script');
        z.src = 'https://' + host + bookmarklet_url + r4();
        b.appendChild(z);
    }
})(
    'maldive.ccnmtl.columbia.edu',
    '/bookmarklets/analyze.js?',
    '/accounts/logged_in.js?version=1'
);
