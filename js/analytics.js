var domainExp = /(\/\/www\.|\/\/)(((?!\/).)*)\//
var presetColors = new Object();
var charts = [];

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

function cleanseDomain(domain) {
	return domain.split(".").join("").split(":").join("");
}

function addLegendPoint(domain, color) {
	var domainId = cleanseDomain(domain);
	$("#legend-dynamic").append('<li id="' + domainId + '"><a class="legend-point clearfix" href="#"><span class="bullet"></span><span class="domain">' + domain + '</span></a></li>');
	$("#" + domainId + " span.bullet").css('background-color', color);
}

function selectLegendPoint(domain) {
	$("#legend li.selected").removeClass("selected");
	$("#" + cleanseDomain(domain)).addClass("selected");
}

function legendPointClicked(e) {
	var domain = $($(this).children("span.domain")[0]).html();
	
	var currentSelected = $($("#legend li.selected")[0]);
	var domainId = cleanseDomain(domain);
	if (currentSelected.attr('id') == domainId) {
		explodeSegment("");
		selectLegendPoint("");
	} else {
		selectLegendPoint(domain);
		explodeSegment(domain);
	}

	e.preventDefault();
	return false;
}

function scrollToLegendPoint(domain, callback) {
	$parent = $("#legend ul");
	$innerItem = $("#" + cleanseDomain(domain));

	$parent.animate({
		scrollTop: $parent.scrollTop() + $innerItem.position().top - $parent.height()/2 + $innerItem.height()/2
	}, 300, "swing", callback);
}

function explodeSegment(label) {
	charts.forEach(function(chart) {
		var dataPoints = chart.options.data[0].dataPoints;
		for (var i=0; i<dataPoints.length; i++) {
			if (dataPoints[i].indexLabel == label) {
				dataPoints[i].exploded = true;
			} else {
				dataPoints[i].exploded = false;
			}
		}

		chart.render();
	});
}

function segmentClicked(event) {
	if (!event.dataPoint.exploded) { // inverted because at the time of this callback, explosion has already happened
		explodeSegment("");
		selectLegendPoint("");
	} else {
		explodeSegment(event.dataPoint.indexLabel);
		scrollToLegendPoint(event.dataPoint.indexLabel, function() {
			selectLegendPoint(event.dataPoint.indexLabel);
		});
	}
}

function generateSegments(data, totalVisits) {
	var minVisits = totalVisits * 0.005;
	var soFar = 0;
	var chartData = [];

	for (var i=0; i<data.length; i++) {
		site = data[i];

		if (site.visits > minVisits) {
			var color = presetColors[site.site];
			if (color == undefined) {
				color = randomColor({lumosity: 'light'});
				presetColors[site.site] = color;

				addLegendPoint(site.site, color);
			}

			chartData.push({
				y: site.visits,
				indexLabel: site.site,
				color: color,
				exploded: false
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
			indexLabel: "other",
			color: "#eee",
			exploded: false
		});
	}

	return chartData;
}

function fetchVisits(startTime, endTime, callback) {
	chrome.history.search({
		text: '',
		maxResults: 100000,
		startTime: startTime,
		endTime: endTime
	}, function(rawData) {
		var collapsedVisits = new Object();
		var uniqueUrls = 0;
		var urlsSearched = 0;
		var totalVisits = 0;

		function done() {
			urlsSearched ++;
			if (urlsSearched == uniqueUrls) {
				callback(collapsedVisits, totalVisits);
			}
		}

		rawData.forEach(function(historyObj) {
			var domain = historyObj.url.match(domainExp)[2];
			var urlVisits = 0;

			uniqueUrls ++;

			chrome.history.getVisits({ url: historyObj.url }, function(visitItems) {
				visitItems.forEach(function(visitObj) {
					if (visitObj.visitTime && visitObj.visitTime >= startTime && visitObj.visitTime <= endTime) {
						urlVisits ++;
					}
				});

				if (collapsedVisits[domain] != undefined) {
					collapsedVisits[domain] = collapsedVisits[domain] + urlVisits;
				} else {
					collapsedVisits[domain] = urlVisits;
				}

				totalVisits += urlVisits;
				done();
			});
		});
	});
}

function drawChart(collapsedVisits, totalVisits, name, elementId) {
	var visitArray = quicksort($.map(collapsedVisits, function(value, index) {
		return {
			site: index,
			visits: value
		};
	}));

	var chart = new CanvasJS.Chart(elementId, {
		title: {
			text: name,
			margin: 0,
			padding: 0,
			fontSize: 0
		},
		animationEnabled: false,
		data: [
			{
				type: "pie",
				indexLabelFontSize: 10,
				indexLabelPlacement: "inside",
				indexLabelBackgroundColor: "rgba(255,255,255,0)",
				indexLabelFontColor: "rgba(0,0,0,0)",
				startAngle: 270,
				toolTipContent: "{indexLabel}: {y} visits",
				click: segmentClicked,
				showInLegend: false,
				dataPoints: generateSegments(visitArray, totalVisits)
			}
		]
	});

	chart.render();
	charts.push(chart);
}

$(function() {
	var d = new Date();

	fetchVisits(
		new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0).getTime(),
		d.getTime(),
		function(visits, total) {
			drawChart(visits, total, "Today", "day");
			$("a.canvasjs-chart-credit").css("color", "white");

			fetchVisits(
				d.getTime() - 604800000,
				d.getTime(),
				function(visits, total) {
					drawChart(visits, total, "This week", "week");
					$("a.canvasjs-chart-credit").css("color", "white");

					fetchVisits(
						d.getTime() - (4 * 604800000),
						d.getTime(),
						function(visits, total) {
							drawChart(visits, total, "This month", "month");
							$("a.canvasjs-chart-credit").css("color", "white");

							chrome.history.search({
								text: '',
								maxResults: 100000,
								startTime: 0,
								endTime: d.getTime()
							}, function(rawData) {
								var collapsedVisits = new Object();
								var totalVisits = 0;

								rawData.forEach(function(historyObj) {
									var domain = historyObj.url.match(domainExp)[2];

									if (collapsedVisits[domain] != undefined) {
										collapsedVisits[domain] = collapsedVisits[domain] + historyObj.visitCount;
									} else {
										collapsedVisits[domain] = historyObj.visitCount;
									}

									totalVisits += historyObj.visitCount;
								});

								drawChart(collapsedVisits, totalVisits, "All time", "all-time");

								$("a.canvasjs-chart-credit").css("color", "white");
								$("a.legend-point").click(legendPointClicked);
							});
						}
					);
				}
			);
		}
	);
});