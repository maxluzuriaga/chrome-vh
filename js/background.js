var myid = chrome.runtime.id;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tab.url == "chrome://history/") {
		chrome.pageAction.show(tabId);
	}
});

chrome.pageAction.onClicked.addListener(function(activeTab) {
	chrome.tabs.create({url: "index.html"});
});