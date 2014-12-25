var domainExp = /(\/\/www.|\/\/)(((?!\/).)*)\//

chrome.history.search({
	text: "",
	maxResults: 100000,
	startTime: new Date().getTime() - 604800000, // one week ago
	endTime: new Date().getTime()
}, function(x) {
	console.log(x);
	alert(x[0].url.match(domainExp)[2])
});