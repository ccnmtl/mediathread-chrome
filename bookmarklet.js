(function(host, bookmarklet_url, user_url) {
    var b = document.body;
    var sb = window.SherdBookmarkletOptions;
    if (!sb) {
        sb = window.SherdBookmarkletOptions = {};
        sb['action'] = 'jump';
    }

    sb['host_url'] = 'https://'+host+'/save/?';
    sb['flickr_apikey'] = 'undefined';

    var r4 = function() {
        return '&nocache='+Number(new Date());
    };

    if (b) {
        var x = document.createElement('script');
        x.src = 'https://'+host+user_url+r4();
        b.appendChild(x);
        var z = document.createElement('script');
        z.src = 'https://'+host+bookmarklet_url+r4();
        b.appendChild(z);
        var y = document.createElement('script');
        y.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
        var onload = (/MSIE/.test(navigator.userAgent)) ? 'onreadystatechange' : 'onload';
        y[onload] = function() {
            var jQ = sb.jQuery = jQuery.noConflict(true);
            if (sb && sb.onJQuery) {
                sb.onJQuery(jQ);
            }
        };
        b.appendChild(y);
    }
})(
    'maldive.ccnmtl.columbia.edu',
    '/bookmarklets/analyze.js?',
    '/accounts/logged_in.js?version=1'
)
