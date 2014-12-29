var myid = chrome.runtime.id;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tab.url == "chrome://history/" || tab.url.indexOf(myid) > -1) {
		chrome.pageAction.show(tabId);
	}
});

chrome.pageAction.onClicked.addListener(function(activeTab) {
	alert(activeTab);
	chrome.tabs.create({url: "index.html"});
});