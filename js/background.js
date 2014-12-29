chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// alert(tab.url);
	if (tab.url == "chrome://history/") {
		chrome.pageAction.show(tabId);
	}
});

chrome.pageAction.onClicked.addListener(function(activeTab) {
	chrome.tabs.create({url: "index.html"});
});