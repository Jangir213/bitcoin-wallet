

(function () {

    // Save port to communicate with content scripts
    var responsePort = null;
    chrome.runtime.onConnect.addListener(function(port) {
        responsePort = port;
    });

    // Create context menus
    chrome.contextMenus.create({'title': 'Pay %s', 'contexts': ['selection'], 'onclick': menuOnClick});
    chrome.contextMenus.create({'title': 'Send BTC', 'contexts': ['page'], 'onclick': menuOnClick});
    function menuOnClick(info) {
        if (info.selectionText) {
            responsePort.postMessage({'address': info.selectionText});
        } else {
            responsePort.postMessage({});
        }
    };

    // Open new tabs
    chrome.runtime.onMessage.addListener(function (request) {
        if (request.address) {
            chrome.tabs.create({url: 'https://blockchain.info/address/' + request.address});
        }
    });

})();