Chrome Visual History
=====================

A Chome extension that lets you see your Chrome history by breaking it down visually by site in the form of a pie chart. See the sites you visited the most today, this week, this month, and all time!

[Available in the Chrome webstore here!](https://chrome.google.com/webstore/detail/chrome-visual-history/dkccpmgeknngdmagkjjacapdecnoeiai)

The extension uses the [chrome.history api](https://developer.chrome.com/extensions/history) to go through the user's visited pages and divide up the information by domain and time, then displays that information in the form of four Pie charts: one for today, one for this week, one for this month, and one for traffic throughout all time. The charts are generated using [canvas.js](http://canvasjs.com/), and I wrote additional Javascript on top of that to add interactivity between the charts and with the auto-generated legend to the right of the charts.