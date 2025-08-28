/* eslint-env jquery */
/* global chrome */

$('head').append(
    $('<link>')
        .attr('rel', 'stylesheet')
        .attr('type', 'text/css')
        .attr('href', chrome.runtime.getURL('css/mediathread_collect.css'))
);
