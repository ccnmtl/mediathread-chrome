# mediathread-chrome

[![Actions Status](https://github.com/ccnmtl/mediathread-chrome/workflows/build-and-test/badge.svg)](https://github.com/ccnmtl/mediathread-chrome/actions)
 
Chrome extension for importing assets to [Mediathread](http://mediathread.info/)

## Installation
Download from the Chrome Web Store [here](https://chrome.google.com/webstore/detail/mediathread/gambcgmmppeklfmbahomokogelnaffbi).

To run from source, clone this repository, go to chrome://extensions
in your Chrome browser, and use the "Load unpacked extension" button
to load the source directory.

## Development Notes

### Release Checklist
* Update ChangeLog
* Increment version number in manifest.json and package.json
* Make a new release for the new version in GitHub
* Download the .zip file that GitHub made for this release
* Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
* Click on the Mediathread row. On the left side, click Package. Then, on the top-right, click "Upload new package".
* Upload zip file to Google, and Publish. Google takes up to an hour to process and release this.
