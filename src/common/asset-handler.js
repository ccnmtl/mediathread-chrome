/* eslint-env jquery, node */
/* global MediathreadCollect, chrome */

var assetHandler = (function() {
    var clean = function(str) {
        return str.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s+/, ' ');
    };

    var findByAttr = function(jq, tag, attr, val, par) {
        return jq(tag + '[' + attr + '=' + val + ']', par);
    };

    var flowclipMetaSearch = function() {
        var metaData = {};
        var metaDataElms = $('*[itemprop]', document);
        if (typeof metaDataElms !== 'undefined') {
            metaDataElms.each(function() {
                var itemProp = $(this).attr('itemprop');
                var val = $(this).text();
                if ($(this).attr('itemref')) {
                    var metaId = $(this).attr('itemref');
                    if (typeof metaData['metadata-' + itemProp] ===
                        'undefined') {
                        metaData['metadata-' + itemProp] = {};
                    }
                    var metaListItem = $('#' + metaId).text();
                    metaData['metadata-' + itemProp][metaId] = metaListItem;
                }
                if (itemProp === 'title') {
                    metaData[itemProp] = val;
                } else if (
                    typeof metaData['metadata-' + itemProp] !== 'object'
                ) {
                    metaData['metadata-' + itemProp] = val;
                }
            });
            for (var data in metaData) {
                if (typeof metaData[data] === 'object') {
                    var flatMetaData = '';
                    for (var str in metaData[data]) {
                        if (flatMetaData === '') {
                            flatMetaData = metaData[data][str];
                        } else {
                            flatMetaData += ', ' + metaData[data][str];
                        }
                    }
                    metaData[data] = flatMetaData;
                }// end if typeof metaData[data]
            }
            return metaData;
        }// end meta_data_elms !== undefined
    };

    var microdataSearch = function(elem, doc) {
        var item;
        $(elem).parents('[itemscope]').each(function() {
            item = this;
        });
        if (item) {
            if (item.properties) {
                return item.properties;
            } else {
                var props = {};
                var abs = MediathreadCollect.absoluteUrl;
                $('[itemprop]', item).each(function() {
                    var p = this.getAttribute('itemprop');
                    props[p] = props[p] || [];
                    switch (String(this.tagName).toLowerCase()) {
                        case 'a':
                        case 'link':
                        case 'area':
                            props[p].push(abs(this.href, doc));
                            break;
                        case 'audio':
                        case 'embed':
                        case 'iframe':
                        case 'img':
                        case 'source':
                        case 'video':
                            if (this.src) {
                                props[p].push(abs(this.src, doc));
                            }
                            break;
                        default:
                            props[p].push($(this).text());
                            break;
                    }
                });
                return props;
            }
        }
    };

    var metadataTableSearch = function(elem, doc) {
        /*If asset is in a table and the next row has the word 'Metadata' */
        if ('td' === elem.parentNode.tagName.toLowerCase()) {
            var trs = $(elem.parentNode.parentNode).nextAll();
            if (trs.length && /metadata/i.test($(trs[0]).text())) {
                var props = {};
                trs.each(function() {
                    var tds = $('td', this);
                    if (tds.length === 2) {
                        var p = clean($(tds[0]).text());
                        if (p) {
                            props[p] = props[p] || [];
                            var val = clean($(tds[1]).text());
                            // if there's an <a> tag, then use the URL -- use
                            // for thumbs
                            $('a', tds[1]).slice(0, 1).each(function() {
                                val = MediathreadCollect.absoluteUrl(
                                    this.href, doc);
                            });
                            props[p].push(val);
                        }
                    }
                });
                return props;
            }
        }
    };

    var mergeMetadata = function(result, metadata) {
        if (!metadata) {
            return;
        }
        if (!result.metadata) {
            result.metadata = metadata;
            return result.metadata;
        } else {
            for (var a in metadata) {
                if (result.metadata[a]) {
                    result.metadata[a].push.apply(
                        result.metadata[a], metadata[a]);
                } else {
                    result.metadata[a] = metadata[a];
                }
            }
        }
        return metadata;
    };

    var metadataSearch = function(result, doc) {
        /*
          searches for neighboring metadata in microdata and some
          ad-hoc microformats
        */
        if (!mergeMetadata(result, metadataTableSearch(result.html, doc))) {
            mergeMetadata(result, microdataSearch(result.html, doc));
        }
        var meta = result.metadata;
        if (meta) {
            //move appopriate keys to result.sources
            var s = {
                'title': meta.title || meta.title,
                'thumb': meta.thumb || meta.Thumb || meta.Thumbnail ||
                    meta.thumbnail
            };
            for (var a in s) {
                if (s[a]) {
                    result.sources[a] = s[a].shift();
                }
            }
        }
    };

    var xml2dom = function(str) {
        if (window.DOMParser) {
            var p = new DOMParser();
            return p.parseFromString(str, 'text/xml');
        } else {
            var div = document.createElement('div');
            $(div).text(str);
            return div;
        }
    };

    var handler = {};

    handler.objects_and_embeds = {
        players: {
            'youtube': {
                match: function(emb) {
                    ///ONLY <EMBED>
                    return String(emb.src).match(
                        /^https:\/\/www.youtube.com\/v\/([\w-]*)/);
                },
                asset: function(
                    emb, match, context, index, optionalCallback
                ) {
                    var apikey = MediathreadCollect.options.youtube_apikey;

                    var VIDEO_ID;
                    if (match && match.length > 0) {
                        VIDEO_ID = match[1]; //e.g. 'LPHEvaNjdhw';
                    } else {
                        return {};
                    }
                    var rv = {
                        html: emb,
                        wait: true,
                        primary_type: 'youtube',
                        label: 'youtube video',
                        sources: {
                            'youtube': 'https://www.youtube.com/v/' +
                                VIDEO_ID + '?enablejsapi=1&fs=1',
                            'gapi': 'https://www.googleapis.com/' +
                                'youtube/v3/videos?id=' + VIDEO_ID
                        }
                    };

                    if (emb.getCurrentTime) {
                        if (emb.getCurrentTime() > 0 &&
                            emb.getCurrentTime() < emb.getDuration()
                        ) {
                            rv.hash = 'start=' + emb.getCurrentTime();
                        }
                    }
                    var ytCallback = function(ytData) {
                        if (
                            $.type(ytData.items) === 'array' &&
                                ytData.items.length > 0
                        ) {
                            var item = ytData.items[0].snippet;
                            rv.sources.title = item.title;

                            var th = item.thumbnails.default;
                            rv.sources.thumb = th.url;
                            rv.sources['thumb-metadata'] = 'w' + th.width +
                                'h' + th.height;

                            rv.metadata = {
                                'Description': [item.description],
                                'Channel': [item.channelTitle],
                                'Published': [item.publishedAt]
                            };
                            rv.disabled = !ytData.items[0].status
                                .embeddable;
                        }
                        optionalCallback(index, rv);
                    };

                    // url params as specified here:
                    // https://developers.google.com/youtube/v3/docs/videos/list#try-it
                    var urlParams = {
                        key: apikey,
                        part: 'snippet,status'
                    };

                    chrome.runtime.sendMessage({
                        contentScriptQuery: 'getYoutubeAsset',
                        ytApiUrl: rv.sources.gapi,
                        urlParams: urlParams
                    }, ytCallback);

                    // Decrease the z-index of youtube's header so the
                    // extension's header is visible.
                    $('#masthead-positioner').css('z-index', '999');
                    return rv;
                }
            },/*end youtube embeds*/
            'jwplayer5': {
                match: function(obj) {
                    return ((typeof obj.getPlaylist === 'function' &&
                             typeof obj.sendEvent === 'function') || null);
                },
                asset: function(obj, match, context) {
                    var item;
                    var pl = obj.getPlaylist();
                    switch (pl.length) {
                        case 0:
                            return {};
                        case 1:
                            item = pl[0];
                            break;
                        default:
                            //or should we just show all options?
                            if (obj.jwGetPlaylistIndex) {
                                item = pl[obj.jwGetPlaylistIndex()];
                            } else {
                                return {};
                            }
                    }
                    var rv = {
                        'html':
                        obj,
                        'primary_type': 'video',
                        'sources': {}
                    };
                    var c = obj.getConfig();
                    var pcfg = obj.getPluginConfig('http');
                    if (item.type === 'rtmp') {
                        // ensure that mp4 rtmp files contain the
                        // needed mp4: prefix so that they will play
                        // properly in flowplayer;
                        // JW Player allows you to omit this prefix,
                        // but Flowplayer does not
                        //
                        // if item.file ends with mp4,
                        // and item.file does not already begin with mp4:,
                        // then append mp4: to item.file
                        if ((/mp4$/.test(item.file)) &&
                            !(/^mp4:/.test(item.file))) {
                            item.file = 'mp4:' + item.file;
                        }

                        rv.sources.video_rtmp = item.streamer + '//' +
                            item.file;
                        rv.primary_type = 'video_rtmp';
                    } else {
                        var url = item.streamer + item.file;
                        if (pcfg.startparam) {
                            rv.primary_type = 'video_pseudo';
                            url += '?' + pcfg.startparam + '=${start}';
                        }
                        rv.sources[rv.primary_type] = url;
                    }
                    rv.sources[rv.primary_type + '-metadata'] =
                        'w' + c.width + 'h' + c.height;
                    if (item.image) {
                        rv.sources.thumb =
                            MediathreadCollect.absoluteUrl(
                                item.image,
                                context.document);
                    }
                    if (item.title) {
                        rv.sources.title = item.title;
                    } else {
                        rv.sources.title = document.title;
                    }
                    return rv;
                }
            },
            'flowplayer3': {
                match: function(obj) {
                    if (obj.data) {
                        return String(obj.data)
                            .match(/flowplayer[.\-\w]+3[.\d]+\.swf/);
                    } else {//IE7 ?+
                        var movie = findByAttr(
                            $, 'param', 'name', 'movie', obj);
                        return (
                            (movie.length) ?
                                String(movie.get(0).value)
                                    .match(/flowplayer-3[.\d]+\.swf/) :
                                null);
                    }
                },
                asset: function(obj, match, context) {
                    /* TODO: 1. support audio
                     */
                    var $f = (context.window.$f && context.window.$f(
                        obj.parentNode));

                    //config=
                    var cfg = (($f) ? $f.getConfig() :
                        $.parseJSON($('param[name=flashvars]')
                            .get(0).value.substr(7)));

                    //getClip() works if someone's already clicked Play
                    var clip = ($f && $f.getClip()) || cfg.clip ||
                        cfg.playlist[0];
                    var time = ($f && $f.getTime()) || 0;
                    return this.queryasset(
                        context,
                        obj,
                        cfg,
                        clip,
                        time,
                        ($f && $f.id() || undefined));
                },
                queryasset: function(context, obj, cfg,
                    clip, time, refId) {
                    var sources = {};
                    var type = 'video';
                    var abs = MediathreadCollect.absoluteUrl;
                    if (cfg.playlist &&
                        (!clip.url || cfg.playlist.length > 1)
                    ) {
                        for (var i = 0; i < cfg.playlist.length; i++) {
                            var p = cfg.playlist[i];
                            var url =  abs(
                                ((typeof p === 'string') ? p : p.url),
                                context.document, p.baseUrl);
                            if (/\.(jpg|jpeg|png|gif)/.test(url)) {
                                //redundant urls wasteful, but useful
                                sources.thumb = url;
                                sources.poster = url;
                                continue;
                            } else if (!clip.type || clip.type === 'image') {
                                if (/\.flv$/.test(url)) {
                                    clip = p;
                                    type = 'flv';
                                    break;
                                } else if (/\.mp4$/.test(url)) {
                                    clip = p;
                                    type = 'mp4';
                                    break;
                                }
                            }
                        }
                    }
                    var provider = (clip.provider &&
                                    cfg.plugins[clip.provider]) || false;
                    function getProvider() {
                        if (provider) {
                            var plugin = provider.url;
                            if (/pseudostreaming/.test(plugin)) {
                                return '_pseudo';
                            } else if (/rtmp/.test(plugin)) {
                                return '_rtmp';
                            }
                        }
                        return '';
                    }
                    var primaryType = type + getProvider(clip);
                    sources[primaryType] = clip.completeUrl ||
                        clip.originalUrl || clip.resolvedUrl ||
                        clip.url || clip;
                    if (provider && provider.netConnectionUrl) {
                        sources[primaryType] = provider.netConnectionUrl +
                            sources[primaryType];
                    }
                    // TODO:is context.document the right
                    // relative URL instead of the SWF?
                    sources[primaryType] = abs(
                        sources[primaryType], context.document);
                    if (/_pseudo/.test(primaryType) &&
                        cfg.plugins[clip.provider].queryString) {
                        sources[primaryType] +=
                            unescape(
                                cfg.plugins[clip.provider].queryString);
                    }
                    if (clip.width && clip.width >= obj.offsetWidth) {
                        sources[primaryType + '-metadata'] =
                            'w' + clip.width + 'h' + clip.height;
                    } else {
                        sources[primaryType + '-metadata'] =
                            'w' + obj.offsetWidth +
                            'h' + (obj.offsetHeight - 25);
                    }

                    var metaObj = flowclipMetaSearch(document);
                    for (var k in metaObj) {
                        sources[k] = metaObj[k];
                    }
                    if (!sources.thumb) {
                        var paramConfig =
                            $('*[name=flashvars]')[0].value
                                .split('config=')[1];
                        paramConfig = JSON.parse(paramConfig);
                        var paramObj = paramConfig;
                        var paramThumb;
                        if (paramObj &&
                            paramObj.canvas &&
                            paramObj.canvas.background
                        ) {
                            var bg = paramObj.canvas.background;
                            var bgsplit = bg.split('url(');
                            if (bgsplit.length > 1) {
                                paramThumb = bgsplit[1].split(')')[0];
                            }
                            // Otherwise,
                            // background doesn't contain the string "url()",
                            // so it's probably something like #000000. Just
                            // ignore it - the thumbnail isn't essential.
                        }
                        sources.thumb = paramThumb;
                    }
                    return {
                        'html': obj,
                        'sources': sources,
                        'label': 'video',
                        'primary_type': primaryType,
                        'hash': 'start=' + Math.floor(time),
                        'ref_id': refId //used for merging
                    };
                }
            },/*end flowplayer3*/
            ///used at web.mit.edu/shakespeare/asia/
            'flvplayer_progressive': {
                match: function(emb) {
                    ///ONLY <EMBED>
                    return String(emb.src)
                        .match(/FLVPlayer_Progressive\.swf/);
                },
                asset: function(emb, match, context) {
                    var abs = MediathreadCollect.absoluteUrl;
                    var flashvars = emb.getAttribute('flashvars');
                    if (flashvars) {
                        var stream = flashvars.match(/streamName=([^&]+)/);
                        if (stream !== null) {
                            return {
                                'html': emb,
                                'primary_type': 'flv',
                                'sources': {
                                    'flv': abs(
                                        stream[1],
                                        context.document) + '.flv'
                                }
                            };
                        }
                    }
                    return {};
                }
            },/*end flvplayer_progressive*/
            'kaltura': {
                match: function(objemb) {
                    var movie = $(objemb).children(
                        'param[name=movie],param[name=MOVIE]');

                    // kaltura & vimeo use the same classid,
                    // apparently vimeo was built off kaltura?
                    return (
                        (objemb.classid ===
                         'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' &&
                         movie.val().search('kaltura') > -1) ||
                            (String(objemb.type)
                                .search('x-shockwave-flash') > -1 &&
                             ((objemb.data &&
                               String(objemb.data).search('kaltura') > -1
                             ) ||
                              (objemb.src &&
                               String(objemb.src).search('kaltura') > -1) ||
                              (objemb.resource && String(objemb.resource)
                                  .search('kaltura') > -1)))) || null;
                },
                asset: function(objemb) {
                    var stream = objemb.data || objemb.src;
                    if (!stream) {
                        var movie = $(objemb).children(
                            'param[name=movie],param[name=MOVIE]');
                        stream = movie.val();
                    }

                    if (!stream) {
                        return {};
                    }
                    var rv = {
                        html: objemb,
                        primary_type: 'kaltura',
                        label: 'kaltura video',
                        sources: {
                            'kaltura': stream
                        }
                    };

                    if (objemb.evaluate) {
                        var currentTime = objemb.evaluate(
                            '{video.player.currentTime}');
                        if (typeof currentTime !== 'undefined' &&
                            currentTime > 0) {
                            rv.hash = 'start=' + currentTime;
                        }

                        var entry = objemb.evaluate('{mediaProxy.entry}');
                        rv.sources.title = entry.name;
                        rv.sources.thumb = entry.thumbnailUrl;
                        rv.sources['metadata-owner'] = entry.userId ||
                            undefined;
                        rv.sources.width = entry.width;
                        rv.sources.height = entry.height;
                        rv.sources.downloadUrl = entry.downloadUrl;
                    }

                    return rv;
                }
            },
            'quicktime': {
                match: function(objemb) {
                    return (
                        objemb.classid ===
                            'clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B' ||
                            String(objemb.type).match(/quicktime/) !==
                            null ||
                            String(objemb.src).match(/\.(mov|m4v)$/) !==
                            null
                    ) || null;
                },
                asset: function(objemb, match, context) {
                    var abs = MediathreadCollect.absoluteUrl;
                    var src = objemb.src || $(objemb).children(
                        'param[name=src],param[name=SRC]');
                    if (src.length) {
                        src = (src.get) ? src.get(0).value : src;
                        return {
                            'html': objemb,
                            'primary_type': 'quicktime',
                            'sources': {
                                'quicktime': abs(src, context.document),
                                'quicktime-metadata': 'w' +
                                    objemb.offsetWidth +
                                    'h' + objemb.offsetHeight
                            }
                        };
                    } else {
                        return {};
                    }
                }
            },
            'moogaloop': {
                match: function(objemb) {
                    var movie = $(objemb).children(
                        'param[name=movie],param[name=MOVIE]');

                    return (
                        (objemb.classid ===
                         'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' &&
                         movie.val().search('moogaloop') > -1) ||
                            (String(objemb.type)
                                .search('x-shockwave-flash') > -1 &&
                             ((objemb.data && String(objemb.data)
                                 .search('moogaloop.swf')) > -1 ||
                              (objemb.src && String(objemb.src)
                                  .search('moogaloop.swf') > -1)))) || null;
                },
                asset: function(objemb, matchRv, context,
                    index, optionalCallback) {
                    var vimeoId;
                    if (matchRv) {
                        vimeoId = matchRv;
                    } else {
                        var matches = objemb.src &&
                            objemb.src.match(/clip_id=([\d]*)/);
                        if (!matches || matches.length < 1) {
                            var flashvars = $(objemb)
                                .children(
                                    'param[name=flashvars],' +
                                        'param[name=FLASHVARS]');
                            if (!flashvars.val()) {
                                return {};
                            }
                            matches = flashvars.val()
                                .match(/clip_id=([\d]*)/);
                        }
                        if (!matches || matches.length < 2) {
                            return {};
                        }
                        vimeoId = matches[1];
                    }

                    var rv = {
                        html: objemb,
                        wait: true,
                        primary_type: 'vimeo',
                        label: 'vimeo video',
                        sources: {
                            'url': 'https://vimeo.com/' + vimeoId,
                            'vimeo': 'https://vimeo.com/' + vimeoId
                        }};

                    if (objemb.api_getCurrentTime) {
                        if (objemb.api_getCurrentTime() > 0) {
                            rv.hash = 'start=' +
                                objemb.api_getCurrentTime();
                        }
                    }

                    var vmCallback = function(vmData) {
                        if (vmData && vmData.length > 0) {
                            var info = vmData[0];
                            rv.sources.title = info.title;
                            rv.sources.thumb = info.thumbnail_medium;
                            rv.sources['metadata-owner'] = info.user_name ||
                                undefined;
                            rv.sources.width = info.width;
                            rv.sources.height = info.height;
                        }
                        optionalCallback(index, rv);
                    };

                    var url = 'https://vimeo.com/api/v2/video/' +
                        vimeoId + '.json';
                    $.ajax({
                        url: url,
                        dataType: 'json',
                        success: vmCallback,
                        error: function() {
                            optionalCallback(index);
                        }
                    });
                    return rv;
                }
            },
            'zoomify': {
                match: function(objemb) {
                    return (String(objemb.innerHTML)
                        .match(/zoomifyImagePath=([^&"']*)/) ||
                            String(objemb.flashvars)
                                .match(/zoomifyImagePath=([^&"']*)/));
                },
                asset: function(objemb, match, context,
                    index, optionalCallback) {
                    var tileRoot = MediathreadCollect.absoluteUrl(
                        match[1], context.document);
                    //chomp trailing /
                    tileRoot = tileRoot.replace(/\/$/, '');
                    var img = document.createElement('img');
                    img.src = tileRoot + '/TileGroup0/0-0-0.jpg';
                    var rvZoomify = {
                        'html': objemb,
                        'primary_type': 'image',
                        'label': 'Zoomify',
                        'sources': {
                            //better guess than 0-0-0.jpg
                            'title': tileRoot.split('/').pop(),
                            'xyztile': tileRoot +
                                '/TileGroup0/${z}-${x}-${y}.jpg',
                            'thumb': img.src,
                            'image': img.src, /*nothing bigger available*/
                            'image-metadata': 'w' + img.width +
                                'h' + img.height
                        },
                        wait: true
                    };
                    var hardWay = function() {
                        //security error?
                        //Let's try it the hard way!
                        var dim = {
                            z: 0,
                            x: 0,
                            y: 0,
                            tilegrp: 0
                        };
                        function walktiles(mode) {
                            var tile = document.createElement('img');
                            tile.onload = function() {
                                switch (mode) {
                                    case 'z': ++dim.z;
                                        dim.width = tile.width;
                                        dim.height = tile.height;
                                        break;
                                    case 'x': ++dim.x;
                                        break;
                                    case 'y': ++dim.y;
                                        break;
                                    case 'tilegrp':
                                        ++dim.tilegrp;
                                        break;
                                }
                                walktiles(mode);
                            };
                            tile.onerror = function() {
                                switch (mode) {
                                    case 'z':
                                        --dim.z;
                                        dim.mode = 'x';
                                        return walktiles('x');
                                    case 'x':
                                        --dim.x;
                                        dim.mode = 'y';
                                        return walktiles('y');
                                    case 'y':
                                        if (dim.mode !== 'tilegrp') {
                                            ++dim.tilegrp;
                                            dim.mode = 'y';
                                            return walktiles('tilegrp');
                                        } else {
                                            --dim.y;
                                            rvZoomify
                                                .sources['xyztile-metadata'] =
                                                ('w' + (dim.width * dim.x) +
                                                 'h' + (dim.height * dim.y));
                                            rvZoomify._data_collection =
                                                'Hackish tile walk';
                                            return optionalCallback(
                                                index, rvZoomify);
                                        }
                                    case 'tilegrp': --dim.tilegrp;
                                        var m = dim.mode;
                                        dim.mode = 'tilegrp';
                                        return walktiles(m);
                                }
                            };
                            tile.src = tileRoot + '/TileGroup' +
                                dim.tilegrp + '/' + dim.z + '-' +
                                dim.x + '-' + dim.y + '.jpg';
                        }
                        walktiles('z');
                    };
                    try {
                        $.ajax({
                            url: tileRoot + '/ImageProperties.xml',
                            dataType: 'text',
                            success: function(dir) {
                                var re = /WIDTH="(\d+)"\s+HEIGHT="(\d+)"/;
                                var sizes = dir.match(re);
                                rvZoomify.sources['xyztile-metadata'] =
                                    'w' + (sizes[1]) +
                                    'h' + (sizes[2]);
                                rvZoomify._data_collection =
                                    'ImageProperties.xml';
                                optionalCallback(index, rvZoomify);
                            },
                            error: hardWay
                        });
                    } catch {
                        hardWay();
                    }
                    return rvZoomify;
                }
            }
        },
        find: function(callback, context) {
            var me = this;
            var result = [];
            var waiting = 0;
            var finished = function(index, assetResult) {
                result[index] = assetResult || result[index];
                if (--waiting <= 0) {
                    callback(result);
                }
            };
            function matchNsniff(oe) {
                for (var p in me.players) {
                    var m = me.players[p].match(oe);
                    if (m !== null) {
                        var res = me.players[p].asset(
                            oe, m, context, result.length, finished);
                        if (res.sources) {
                            result.push(res);
                        }
                        if (res.wait) {
                            ++waiting;
                        }
                        break;
                    }
                }
            }
            var embs = context.document.getElementsByTagName('embed');
            var objs = context.document.getElementsByTagName('object');
            for (var i = 0; i < embs.length; i++) {
                matchNsniff(embs[i]);
            }
            for (i = 0; i < objs.length; i++) {
                matchNsniff(objs[i]);
            }
            if (waiting === 0) {
                callback(result);
            }
        }
    };

    handler.video = {
        addSource: function(source, rv, video) {
            var codecs = /[./](ogv|ogg|webm|mp4)/i;
            if (!source.src) {
                return;
            }
            var vidType = 'video';
            var mtype = String(video.type).match(codecs);
            if (mtype) {
                vidType = mtype[1].toLowerCase();
                if (video.canPlayType(video.type) === 'probably') {
                    rv.primary_type = vidType;
                }
            } else if (mtype === String(source.src).match(codecs)) {
                vidType = mtype[1].toLowerCase().replace('ogv', 'ogg');
            }
            if (rv.primary_type === 'video') {
                rv.primary_type = vidType;
            }
            rv.sources[vidType] = source.src;
            rv.sources[vidType + '-metadata'] =
                'w' + video.videoWidth +
                'h' + video.videoHeight;
        },

        find: function(callback, context) {
            var videos = context.document.getElementsByTagName('video');
            var result = [];

            for (var i = 0; i < videos.length; i++) {
                var rv = {
                    'html': videos[i],
                    'label': 'video',
                    'primary_type': 'video',
                    'sources': {}
                };
                if (videos[i].poster) {
                    rv.sources.thumb = videos[i].poster;
                }
                this.addSource(videos[i], rv, videos[i]);
                var sources = videos[i].getElementsByTagName('source');
                for (var j = 0; j < sources.length; j++) {
                    this.addSource(sources[j], rv, videos[i]);
                }
                result.push(rv);
            }
            for (i = 0; i < result.length; i++) {
                metadataSearch(result[i], context.document);
            }
            callback(result);
        }
    };

    handler.audio = {
        find: function(callback) {
            // test if we are on the asset itself, relying on
            // the browser (support) handling the mp3 file
            if (/.mp3$/.test(document.location)) {
                callback([{
                    'html': document.documentElement,
                    'primary_type': 'mp3',
                    'sources': {
                        'mp3': String(document.location)
                    }
                }]);
            } else {//this must be a listing of audio files somewhere
                // on the page.
                window.MediathreadCollect.sndAsset2Django = function(
                    mp3, type
                ) {
                    mp3.each(function(i) {
                        callback([{
                            'html': document.documentElement,
                            'primary_type': 'mp3',
                            'sources': {
                                'mp3': mp3[i][type]
                            }
                        }]);
                    });
                };
                var mp3;
                var type;
                if ($('*[href$="mp3"]').length) {// check for href
                    mp3 = $('*[href$="mp3"]');
                    type = 'href';
                } else if ($('*[src$="mp3"]').length) {// check for src
                    mp3 = $('*[src$="mp3"]');
                    type = 'src';
                }//end else if
                if (typeof mp3 !== 'undefined') {
                    window.MediathreadCollect.sndAsset2Django(mp3, type);
                }//end if
            }//end else
        }//end find
    };

    handler['iframe.postMessage'] = {
        find: function(callback, context) {
            if (!window.postMessage) {
                return callback([]);
            }
            var frms = context.document.getElementsByTagName('iframe');
            MediathreadCollect.connect(
                context.window,
                'message',
                function(evt) {
                    try {
                        var id;
                        var d = $.parseJSON(evt.data);
                        if ((id = String(d.id).match(/^sherd(\d+)/)) &&
                            d.info
                        ) {
                            var i = d.info;
                            switch (i.player) {
                                case 'flowplayer':
                                    var fp =
                                        (MediathreadCollect.assethandler
                                            .objects_and_embeds.players
                                            .flowplayer3.queryasset(
                                                context,
                                                frms[parseInt(id[1], 10)],
                                                i.config,
                                                i.clip,
                                                i.time,
                                                i.id));
                                    return callback([fp]);
                                default:
                                    return callback([]);
                            }
                        }
                    } catch {/*parse error*/}
                });

            for (var i = 0; i < frms.length; i++) {
                try {
                    frms[i].contentWindow.postMessage(
                        '{"event":"info","id":"sherd' + i + '"}', '*');
                } catch {/*pass: probably security error*/}
            }
        }
    };

    handler['iframe.youtube'] = {
        find: function(callback, context) {
            var frms = context.document.getElementsByTagName('iframe');
            var cb = function(ind, rv) {
                callback([rv]);
            };
            for (var i = 0; i < frms.length; i++) {
                var vMatch = String(frms[i].src)
                    .match(/^https:\/\/www.youtube.com\/embed\/([\w-]*)/);
                if (vMatch && vMatch.length > 1) {
                    MediathreadCollect.assethandler
                        .objects_and_embeds.players
                        .youtube.asset(
                            frms[i],
                            vMatch, {
                                'window': window,
                                'document': document
                            },
                            0,
                            cb);
                }
            }
        }
    };

    handler.image = {
        find: function(callback, context) {
            var imgs = context.document.getElementsByTagName('img');
            var result = [];
            var zoomifyUrls = {};
            var done = 0;
            for (var i = 0; i < imgs.length; i++) {
                //IGNORE headers/footers/logos
                var image = imgs[i];
                if (/(footer|header)/.test(image.className) ||
                    //WGBH header
                    /site_title/.test(
                        image.parentNode.parentNode.className) ||
                    //drupal logo
                    /logo/.test(image.id) ||
                    //drupal7 logo
                    /logo/.test(image.parentNode.id) ||
                    //web.mit.edu/shakespeare/asia/
                    /logo\W/.test(image.src)
                ) {
                    continue;
                }
                if (image.src.length > 4096 ||
                    image.src.indexOf('data') === 0
                ) {
                    continue;
                }
                /*recreate the <img> so we get the real width/height */
                var imageInd = document.createElement('img');
                imageInd.src = image.src;
                if (imageInd.width === 0) {
                    //for if it doesn't load immediately
                    //cheating: TODO - $(imageInd).bind('load',
                    //    function() { /*see dropbox.com above*/ });
                    imageInd = image;
                }
                if (imageInd.width >= 400 ||
                    imageInd.height >= 400
                ) {
                    result.push({
                        'html': image,
                        'primary_type': 'image',
                        'sources': {
                            'title': image.title || undefined,
                            'image': image.src,
                            'image-metadata': 'w' + imageInd.width +
                                'h' + imageInd.height
                        }
                    });
                } else {
                    ////Zoomify Tile Images support
                    var zoomifyMatch = String(image.src).match(
                        /^(.*)\/TileGroup\d\//);
                    if (zoomifyMatch) {
                        var tileRoot = MediathreadCollect.absoluteUrl(
                            zoomifyMatch[1],
                            context.document);
                        if (tileRoot in zoomifyUrls) {
                            continue;
                        } else {
                            zoomifyUrls[tileRoot] = 1;
                            var img = document.createElement('img');
                            img.src = tileRoot + '/TileGroup0/0-0-0.jpg';
                            var zoomify = {
                                'html': image,
                                'primary_type': 'image',
                                'sources': {
                                    //better guess than 0-0-0.jpg
                                    'title': tileRoot.split('/').pop(),
                                    'xyztile': tileRoot +
                                        '/TileGroup0/${z}-${x}-${y}.jpg',
                                    'thumb': img.src,
                                    /*nothing bigger available*/
                                    'image': img.src,
                                    'image-metadata': 'w' + img.width +
                                        'h' + img.height
                                }
                            };
                            result.push(zoomify);
                            done++;
                            /*Get width/height from zoomify's XML file
                              img_root + '/source/' + img_key + '/' +
                              img_key + '/ImageProperties.xml'
                            */
                            $.get(
                                tileRoot + '/ImageProperties.xml',
                                null,
                                /* jshint ignore:start */
                                function(dir) {
                                    var sizes = dir.match(
                                        /WIDTH="(\d+)"\s+HEIGHT="(\d+)"/
                                    );
                                    zoomify.sources['xyztile-metadata'] =
                                        'w' + sizes[1] + 'h' + sizes[2];
                                    if (--done === 0) {
                                        callback(result);
                                    }
                                },
                                /* jshint ignore:end */
                                'text');
                        }
                    }
                }
            }
            for (i = 0; i < result.length; i++) {
                metadataSearch(result[i], context.document);
            }
            if (done === 0) {
                callback(result);
            }
        }
    };

    handler.mediathread = {
        // the better we get on more generic things, the more
        // redundant this will be
        // BUT it might have more metadata
        find: function(callback) {
            var result = [];
            $('div.asset-links').each(function() {
                var top = this;
                var res0 = {html: top, sources: {}};
                $('a.assetsource', top).each(function() {
                    var reg = String(this.getAttribute('class'))
                        .match(/assetlabel-(\w+)/);
                    if (reg !== null) {
                        // use getAttribute rather than href,
                        // to avoid urlencodings
                        res0.sources[reg[1]] = this.getAttribute('href');
                        if (/asset-primary/.test(this.className)) {
                            res0.primary_type = reg[1];
                        }
                        if (this.title) {
                            res0.sources.title = this.title;
                        }
                    }
                });
                result.push(res0);
            });
            return callback(result);
        }
    };

    // http://unapi.info/specs/
    handler.unAPI = {
        page_resource: true,
        find: function(callback) {
            var unapi = $('abbr.unapi-id');
            // must find one, or it's not a page resource, and
            // we won't know what asset to connect to
            if (unapi.length === 1) {
                var server = false;
                $('link').each(function() {
                    if (this.rel === 'unapi-server') {
                        server = this.href;
                    }
                });
                if (server) {
                    ///start out only supporting pbcore
                    var format = '?format=pbcore';
                    var requestUrl = server + format + '&id=' +
                        unapi.attr('title');
                    $.ajax({
                        'url': requestUrl,
                        'dataType': 'text',
                        success: function(pbcoreXml) {
                            var rv = {
                                'page_resource': true,
                                'html': unapi.get(0),
                                'primary_type': 'pbcore',
                                'sources': {
                                    'pbcore': requestUrl
                                },
                                'metadata': {
                                    'subject': []
                                }
                            };
                            var pb = xml2dom(pbcoreXml);
                            if ($('PBCoreDescriptionDocument', pb)
                                .length === 0) {
                                return callback([]);
                            }
                            $('title', pb).each(function() {
                                var titleType = $(
                                    'titleType', this.parentNode).text();
                                if (titleType === 'Element' ||
                                    document.title.indexOf(
                                        this.firstChild.data) > -1
                                ) {
                                    rv.sources.title = this.firstChild.data;
                                } else {
                                    rv.metadata[titleType + ':Title'] = [
                                        this.firstChild.data];
                                }
                            });
                            $('description', pb).each(function() {
                                rv.metadata.description = [
                                    this.firstChild.data];
                            });
                            $('contributor', pb).each(function() {
                                var role = $(
                                    'contributorRole',
                                    this.parentNode).text();
                                rv.metadata['Contributor:' + role] =
                                    [this.firstChild.data];
                            });
                            $('coverage', pb).each(function() {
                                var type = $('coverageType',
                                    this.parentNode).text();
                                rv.metadata['Coverage:' + type] =
                                    [this.firstChild.data];
                            });
                            $('rightsSummary', pb).each(function() {
                                rv.metadata.Copyrights =
                                    [this.firstChild.data];
                            });
                            $('subject', pb).each(function() {
                                // TODO: should we care about the
                                // subjectAuthorityUsed?
                                rv.metadata.subject.push(
                                    this.firstChild.data);
                            });
                            $('publisher', pb).each(function() {
                                rv.metadata.publisher =
                                    [this.firstChild.data];
                            });
                            // TODO: should we get video metadata
                            // (betacam, aspect ratio)?
                            callback([rv]);
                        },
                        error: function() {
                            //attempt to scrape manually
                            var rv;
                            // if Openvault
                            if (requestUrl.indexOf('openvault') > 0) {
                                rv = {
                                    'page_resource': true,
                                    'html': document,
                                    'primary_type': 'pbcore',
                                    'sources': {
                                        'pbcore': window.location.href
                                    },
                                    'metadata': {
                                        'subject': []
                                    }
                                };
                                rv.metadata.Description = [
                                    $('.blacklight-dc_description_t .value')
                                        .text()
                                ];
                                rv.metadata.Subject = [
                                    $('.blacklight-topic_cv .value').text()
                                ];
                                rv.metadata.Copyrights =
                                    [$('.copyright').text()];
                                rv.metadata.Publisher =
                                    ['WGBH Educational Foundation'];
                            }
                            if (rv) {
                                callback([rv]);
                            } else {
                                callback([]);
                            }
                        }
                    });
                    return;
                }//end if (server)
            }//end if (unapi.length)
            return callback([]);
        }
    };

    // http://www.oembed.com/
    handler['oEmbed.json'] = {
        page_resource: true,
        find: function(callback) {
            var oembedLink = false;
            $('link').each(function() {
                //jQuery 1.0 compatible
                if (this.type === 'application/json+oembed') {
                    oembedLink = this;
                }
            });
            if (oembedLink) {
                var result = {
                    'html': oembedLink,
                    'sources': {},
                    'metadata': {},
                    'page_resource': true
                };
                $.ajax({
                    'url': result.html.href,
                    'dataType': 'json',
                    success: function(json) {
                        if (json.ref_id) {
                            result.ref_id = json.ref_id;
                        }
                        if (json.url) {
                            switch (json.type) {
                                case 'photo':
                                case 'image':
                                    result.primary_type = 'image';
                                    result.sources.image = json.url;
                                    ///extension: openlayers tiling protocol
                                    if (json.xyztile) {
                                        var xyz = json.xyztile;
                                        result.sources.xyztile = xyz.url;
                                        result.sources['xyztile-metadata'] =
                                            'w' + xyz.width + 'h' + xyz.height;
                                    }
                                    break;
                                case 'video':
                                    result.primary_type = 'video';
                                    if (/\.pseudostreaming-/.test(json.html)) {
                                        result.primary_type = 'video_pseudo';
                                    } else if (/\rtmp/.test(json.html)) {
                                        result.primary_type = 'video_rtmp';
                                    }
                                    result.sources[result.primary_type] =
                                        json.url;
                                    break;
                                default:
                                    return callback([]);
                            }
                            result.sources[
                                result.primary_type + '-metadata'] =
                                'w' + json.width + 'h' + json.height;
                        }
                        if (json.thumbnail_url) {
                            result.sources.thumb = json.thumbnail_url;
                            result.sources['thumb-metadata'] =
                                'w' + json.thumbnail_width +
                                'h' + json.thumbnail_height;
                        }
                        if (json.title) {
                            result.sources.title = json.title;
                        }
                        if (json.description) {
                            result.metadata.description =
                                [json.description];
                        }
                        if (json.metadata) {//extension
                            result.metadata = json.metadata;
                        }
                        callback([result]);
                    },
                    error: function() {callback([]);}
                });
            } else {
                callback([]);
            }
        }
    };

    return handler;
})();

if (typeof module !== 'undefined') {
    module.exports = assetHandler;
}
