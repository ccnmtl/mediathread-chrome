$('head').append(
    $('<link>')
        .attr('rel', 'stylesheet')
        .attr('type', 'text/css')
        .attr('href', chrome.extension.getURL('css/mediathread_collect.css'))
);
