# mediathread-chrome

[![Greenkeeper badge](https://badges.greenkeeper.io/ccnmtl/mediathread-chrome.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/ccnmtl/mediathread-chrome.svg?branch=master)](https://travis-ci.org/ccnmtl/mediathread-chrome)

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
* Click on the Mediathread row. On the left side, click Package. Then, on the top-right, click "Upload new package". (This genius UX always takes me 10 minutes to figure out, so I've documented it here.)
* Upload zip file to Google, and Publish. Google takes up to an hour to process and release this.
