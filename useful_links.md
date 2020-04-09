**To dynamically change the text of a node or edge by clicking on it:**

* http://bl.ocks.org/GerHobbelt/2653660
	* https://gist.github.com/sampablokuper/3100370
* https://bl.ocks.org/cjrd/6863459
	* https://github.com/cjrd/directed-graph-creator/blob/master/graph-creator.js

**To resize the nodes by dragging:**

* https://bl.ocks.org/Herst/093ff9962405dd564ef58ad8af9544d0
* https://stackoverflow.com/questions/31206525/how-to-resize-rectangle-in-d3-js
	* https://jsbin.com/zenomoziso/1/edit?html,js,output
* http://bl.ocks.org/mccannf/1629464
	* https://gist.github.com/mccannf/1629464
* https://stackoverflow.com/questions/42245111/dynamically-resize-a-div-when-it-is-used-as-a-node-in-a-d3-force-directed-graph
	* https://stackoverflow.com/questions/13136355/d3-js-remove-force-drag-from-a-selection

*Note that having two different d3.drag() events leads to some weirdness.*

**To implement a collapsible force layout (could be a good way to show nodes that are children of other nodes)**

* https://bl.ocks.org/mbostock/1093130
* http://jsfiddle.net/vfu78/16/
* https://codepen.io/jefarrell/pen/ReYKPa?editors=1010

*Note that to implement a collapsible force layout the data will need to be formatted in a slightly different way, see the above links for more specifics.*