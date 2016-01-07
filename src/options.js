// Restores select box state using the preferences
// stored in chrome.storage.
function loadOptions() {
    chrome.storage.sync.get('options', function(data) {
        var options = data.options;

        if (!options.hostUrl) {
            var defaultHost = 'https://mediathread.ccnmtl.columbia.edu/';
            options.hostUrl = defaultHost;
        }

        document.getElementById('host_url').value = options.hostUrl;
    });
}

// Saves options to chrome.storage.
function storeOptions() {
    var hostUrl = document.getElementById('host_url').value;
    chrome.storage.sync.set({
        options: {
            hostUrl: hostUrl
        }
    }, function optionsSaved() {
    });
}

document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('host_url').addEventListener('change', storeOptions);
