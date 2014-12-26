var domainExp = /(\/\/www\.|\/\/)(((?!\/).)*)\//
// var ctx = $("#myChart").get(0).getContext("2d");

function quicksort(arr) {
	if (arr.length <= 1) {
		return arr;
	} else {
		var pivot = arr[0];
		var less = [];
		var more = [];

		for (var i=1; i<arr.length; i++) {
			if (arr[i].visits < pivot.visits) {
				less.push(arr[i]);
			} else {
				more.push(arr[i]);
			}
		}

		less = quicksort(less);
		more = quicksort(more);

		return more.concat([pivot]).concat(less);
	}
}

function generateSegments(data, totalVisits) {
	var minVisits = totalVisits * 0.005;
	var soFar = 0;
	var chartData = [];

	for (var i=0; i<data.length; i++) {
		site = data[i];

		if (site.visits > minVisits) {
			chartData.push({
				y: site.visits,
				indexLabel: site.site
			});
			soFar += site.visits;
			lastSegment = site.visits;
		} else {
			break;
		}
	}

	if (soFar < totalVisits) {
		chartData.push({
			y: totalVisits - soFar,
			indexLabel: "other"
		});
	}

	return chartData;
}

$(function() {
	chrome.history.search({
		text: "",
		maxResults: 100000,
		startTime: new Date().getTime() - (52 * 604800000), // one week ago
		endTime: new Date().getTime()
	}, function(data) {
		var collapsedVisits = new Object();
		var totalVisits = 0;

		data.forEach(function(visit) {
			domain = visit.url.match(domainExp)[2];
			if (collapsedVisits[domain] != undefined) {
				collapsedVisits[domain] = collapsedVisits[domain] + visit.visitCount;
			} else {
				collapsedVisits[domain] = visit.visitCount;
			}

			totalVisits += visit.visitCount;
		});

		var visitArray = quicksort($.map(collapsedVisits, function(value, index) {
			return {
				site: index,
				visits: value
			};
		}));

		var chart = new CanvasJS.Chart("myChart", {
			// title: {
			// 	text: "Testing"
			// },
			data: [
				{
					type: "pie",
					showInLegend: false,
					dataPoints: generateSegments(visitArray, totalVisits)
				}
			]
		});

		chart.render();

		// var pieChart = new Chart(ctx).Pie(generateSegments(visitArray, totalVisits), { animateScale: false, showTooltips: true });
	});
});