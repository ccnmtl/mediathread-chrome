$('head').append(
    $('<link>')
        .attr('rel', 'stylesheet')
        .attr('type', 'text/css')
        .attr('href', chrome.extension.getURL('css/sherd_styles.css'))
);
