var prefilledUrls = [
    'https://mediathread.ccnmtl.columbia.edu',
    'https://mediathread.qa.ccnmtl.columbia.edu',
    'https://mediathread.stage.ccnmtl.columbia.edu'
];

// Restores select box state using the preferences
// stored in chrome.storage.
function loadOptions() {
    chrome.storage.sync.get('options', function(data) {
        var options = data.options;

        if (!options.hostUrl) {
            var defaultHost = prefilledUrls[0];
            options.hostUrl = defaultHost;
        }

        if (!options.customUrl) {
            options.customUrl = '';
        }

        // Select the appropriate radio button
        switch (options.hostUrl) {
        case prefilledUrls[0]:
            $('#host_url_prod').prop('checked', true);
            break;
        case prefilledUrls[1]:
            $('#host_url_qa').prop('checked', true);
            break;
        case prefilledUrls[2]:
            $('#host_url_stage').prop('checked', true);
            break;
        case 'other':
            $('#host_url_custom').prop('checked', true);
            $('input[name="custom_url"]').prop('disabled', false);
            break;
        default:
            $('#host_url_prod').prop('checked', true);
            break;
        }

        $('input[name="custom_url"]').val(options.customUrl);
    });
}

document.addEventListener('DOMContentLoaded', loadOptions);

// Saves options to chrome.storage.
function storeOptions(hostUrl, customUrl) {
    $('#infospace').hide();

    if (hostUrl === 'other') {
        $('input[name="custom_url"]').prop('disabled', false);
    } else {
        $('input[name="custom_url"]').prop('disabled', true);
    }

    chrome.storage.sync.set({
        options: {
            hostUrl: hostUrl,
            customUrl: customUrl
        }
    }, function optionsSaved() {
        $('#infospace').fadeIn();
    });
}

$('input[name="custom_url"]').on('change keyup', function() {
    storeOptions('other', this.value);
});

$('input[type="radio"][name="host_url"]').change(function() {
    storeOptions(this.value, $('input[name="custom_url"]').val());
});
