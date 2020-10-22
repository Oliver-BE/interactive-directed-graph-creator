/////////////////////////////////////////////////////////////////////////////////
// INITIAL SETUP // 
/////////////////////////////////////////////////////////////////////////////////

/* Initial Data
  - nodes are known by "id", not by index in array
  - reflexive edges are indicated by a bold black rectangle
  - edges go from source to target; edge directions are set by "left" and "right"
  - edge direction is "right" if source.id is less than target.id ("left" if source.id > target.id)
*/
var dataset = {
        nodes: [
          { id: 0, name: "Adam", h: 70, w: 70, reflexive: false },
          { id: 1, name: "Bob", h: 20, w: 20, reflexive: false },
          { id: 2, name: "Carrie", h: 20, w: 20, reflexive: false }
        ],
        edges: [
          { id: 0, source: 0, target: 1, leftCost: 50, rightCost: 25, left: true, right: true, length: 150 },
          { id: 1, source: 0, target: 2, leftCost: 60, rightCost: 100, left: false, right: true, length: 250 } 
        ]
};

// Variables
var lastNodeId = 2; 
var lastEdgeId = 1;
const width = window.innerWidth;
const height = window.innerHeight;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

// Create svg to hold graph
var svg = d3.select("body")
  .append("svg")
  .attr("oncontextmenu", "return false;")
  .attr("viewBox", "0 0 " + width + " " + height);
  // .attr("width", width)
  // .attr("height", height);

// Initialize D3 force layout
const force = d3.forceSimulation()
  .force("link", d3.forceLink().id((d) => d.id).distance(function(d) {return d.length}))
  .force("charge", d3.forceManyBody().strength(-1000))
  .force("x", d3.forceX(width / 2))
  .force("y", d3.forceY(height / 2))
  .force("collision", d3.forceCollide().radius(12))
  .on("tick", tick);

// Drag functionality for nodes (while shift is held)
const drag = d3.drag()
  .on("start", (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on("drag", (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on("end", (d) => {
    if (!d3.event.active) force.alphaTarget(0);
    //this will make it so the node doesn"t stick in place when you release it
    d.fx = null;
    d.fy = null;
  });

// Arrow markers for links/edges
svg.append("svg:defs").append("svg:marker")
    .attr("id", "end-arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 6)
    .attr("markerWidth", 4)
    .attr("markerHeight", 3)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#000");

svg.append("svg:defs").append("svg:marker")
    .attr("id", "start-arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 4)
    .attr("markerWidth", 4)
    .attr("markerHeight", 3)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M10,-5L0,0L10,5")
    .attr("fill", "#000");

// Line displayed when dragging to add new edges
const dragLine = svg.append("svg:path")
  .attr("class", "link dragline hidden")
  .attr("d", "M0,0L0,0");


// Handles to link and node element groups
var path = svg.append("svg:g").selectAll(".path");
var dummyPath = svg.append("svg:g").selectAll(".path");
var rect = svg.append("svg:g").selectAll("g");

// Mouse event variables
let selectedNode = null;
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}


/////////////////////////////////////////////////////////////////////////////////
// UPDATES TO GRAPH // 
/////////////////////////////////////////////////////////////////////////////////

// Updates the graph (called when needed)
function update() {
  updateLinks();
  updateDummyLinks();
  updateNodes(); 

  // sets the graph in motion
  force
    .nodes(dataset.nodes)
    .force("link").links(dataset.edges);

  force.alphaTarget(0.3).restart();
}


// Updates the edges/links
function updateLinks() {

  // read in data from dataset
  path = path.data(dataset.edges, (d) => d.id);
  
 ///////////////////////////
  // UPDATE EXISTING LINKS //
  ///////////////////////////
  // update overall class if selected
  path.classed("selected", (d) => d === selectedLink);

  // update link marker heads
  path.select(".link").style("marker-start", function(d) {return getMarkers(d, false, true)})
      .style("marker-end", function(d) {return getMarkers(d, false, false)});

  // update cost text
  path.select(".textId").text(function(d) {
    if(d.left) return "L Cost: " + d.leftCost;
    if(d.right) return "R Cost: " + d.rightCost;
  })

  // remove old links
  path.exit().remove();


  ///////////////////
  // ADD NEW LINKS //
  ///////////////////
  // add new container to hold links and link ids 
  var pathContainer = path.enter().append("svg:g").attr("class", "pathClass")
    .classed("selected", function(d) { return d === selectedLink; });

  // add actual link paths
  pathContainer.append("svg:path")
    .attr("class", "link")
    .attr("id", function(d) { return "linkId_" + d.id})
    .style("marker-start", function(d) {return getMarkers(d, false, true)})
    .style("marker-end", function(d) {return getMarkers(d, false, false)})
    .on("mousedown", (d) => {
      if (d3.event.shiftKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode = null;
      update();
    })

    // add edge labels
    pathContainer.append("svg:text")
      .attr("class", "linklabel")
      .attr("id", function(d, i) { return "linklabelId_" + d.id})
      .attr("dy", "1.3em")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
    // add textPath
    .append("svg:textPath")
      .attr("class", "textId")
      .attr("href", function(d, i) { return "#linkId_" + d.id})
      .attr("pointer-events", "none")
      .attr("startOffset", "50%")
      .text(function(d, i) { 
        if(d.left) return "L Cost: " + d.leftCost;
        if(d.right) return "R Cost: " + d.rightCost;
      });

  path = pathContainer.merge(path);
}

// Updates the dummy (hidden) links which are only shown when doubly linked
function updateDummyLinks() {
  
  // read in data from dataset
  dummyPath = dummyPath.data(dataset.edges, (d) => d.id);
 
  ///////////////////////////
  // UPDATE EXISTING LINKS //
  ///////////////////////////

  // update existing link classes
  dummyPath.classed("selected", (d) => d === selectedLink);
  // update link aesthetics
  dummyPath.select(".link").style("marker-start", function(d) {return getMarkers(d, true, true)})
    .style("marker-end", function(d) {return getMarkers(d, true, false)});

  // update hidden class for links and linklabels
  dummyPath.select(".link").classed("hidden", (d) => !(d.left && d.right)); 
  dummyPath.select(".linklabel").classed("hidden", (d) => !(d.left && d.right));

  // update cost text
  dummyPath.select(".textId").text(function(d) { return "R Cost: " + d.rightCost;});

  // remove old links
  dummyPath.exit().remove();

  ///////////////////
  // ADD NEW LINKS //
  ///////////////////
  // add new links
  var dummyPathContainer = dummyPath.enter().append("svg:g").attr("class", "dummyPathClass")
    .classed("selected", (d) => d === selectedLink)

  // add actual link paths
  dummyPathContainer.append("svg:path")
    .attr("class", "link dummy")
    .attr("id", function(d) { return "dummyLinkId_" + d.id})
    .classed("hidden", (d) => !(d.left && d.right))
    .style("marker-start", function(d) {return getMarkers(d, true, true)})
    .style("marker-end", function(d) {return getMarkers(d, true, false)})
    .on("mousedown", (d) => {
      if (d3.event.shiftKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode = null;
      update();
    })

    // add edge labels
    dummyPathContainer.append("svg:text")
      .attr("class", "linklabel")
      .classed("hidden", (d) => !(d.left && d.right))
      .attr("id", function(d, i) { return "dummylinklabelId_" + d.id})
      .attr("dy", "-0.6em")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
    // add textPath
    .append("svg:textPath")
      .attr("class", "textId")
      .classed("hidden", (d) => !(d.left && d.right))
      .attr("href", function(d, i) { return "#dummyLinkId_" + d.id})
      .attr("pointer-events", "none")
      .attr("startOffset", "50%")
      .text(function(d, i) { return "R Cost: " + d.rightCost});

  dummyPath = dummyPathContainer.merge(dummyPath);
}

function updateNodes() {
  
  // NOTE: the function arg is crucial here! nodes are known by id, not by index!
  rect = rect.data(dataset.nodes, (d) => d.id);

  // update existing nodes (reflexive & selected visual states)
  rect.selectAll("rect")
    .style("fill", (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed("reflexive", (d) => d.reflexive);

  // remove old nodes
  rect.exit().remove();

  // add new nodes
  const rectContainer = rect.enter().append("svg:g").attr("class", "node");

  rectContainer.append("svg:rect")
    .attr("class", "rectNode")
    .attr("height", function(d) {
            return d.h
          })
    .attr("width", function(d) {
           return d.w
          })
    .style("fill", (d) => (d === selectedNode) ? d.color.brighter().toString() : d.color )
    .style("fill", (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style("stroke", (d) => d3.rgb(colors(d.id)).darker().toString())
    .classed("reflexive", (d) => d.reflexive)
    .on("mouseover", function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // enlarge target node
      d3.select(this).attr("transform", "scale(1.1)");
    })
    .on("mouseout", function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // unenlarge target node
      d3.select(this).attr("transform", "");
    })
    .on("mousedown", (d) => {
      if (d3.event.shiftKey) return; 

      // select node
      mousedownNode = d;
      selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode;
      selectedLink = null;

      dragLine
        .style("marker-end", "url(#end-arrow)")
        .classed("hidden", false)
        .attr("d", `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      update();
    })
    .on("mouseup", function (d) {
      if (!mousedownNode) return;

      // get rid of the dragLine
      dragLine
        .classed("hidden", true)
        .style("marker-end", "");

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr("transform", "");

      // add link to graph (update if exists)
      // links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      // this sets the length for the new edge as the length between nodes when dragged
      var xChange = mouseupNode.x - mousedownNode.x;
      var yChange = mouseupNode.y - mousedownNode.y;
      var distance = Math.sqrt(xChange * xChange + yChange * yChange);
     
      // checks for existing edge/link in dataset
      const link = dataset.edges.filter((d) => d.source === source && d.target === target)[0];
      // if edge already exists, update it 
      if (link) {
        // if edge being drawn is missing a cost, give it one
        if((link.rightCost === null && isRight) || (link.leftCost === null && !isRight)) {
          var edgeType;
          if(isRight) edgeType = "right";
          else edgeType = "left";
          // read in input
          var newCost = prompt("What is the cost of this " + edgeType + " edge?");
          if(newCost === null) return;
          else{
            while(isNaN(newCost)) newCost = prompt("What is the cost of this " + edgeType + " edge?");
            if(newCost === null) return;
            
            // update edge with new cost
            if(link.rightCost === null && isRight) link.rightCost = Number(newCost);
            else if(link.leftCost === null && !isRight) link.leftCost = Number(newCost);
          }
        }
        
        link[isRight ? "right" : "left"] = true;
        // select the link that was just dragged
        selectedLink = link; 
      } 
      // otherwise, create a new edge and add it to dataset
      else {
        var edgeType;
        if(isRight) edgeType = "right";
        else edgeType = "left";
        var newCost = prompt("What is the cost of this " + edgeType + " edge?");
        
        if(newCost === null) return;
        else{
          while(isNaN(newCost)) newCost = prompt("What is the cost of this " + edgeType + " edge?");
          if(newCost === null) return;
          var newEdge;
          if(isRight) newEdge = { id: ++lastEdgeId, source, target, leftCost: null, rightCost: Number(newCost), left: !isRight, right: isRight, length: distance };
          else newEdge = { id: ++lastEdgeId, source, target, leftCost: Number(newCost), rightCost: null, left: !isRight, right: isRight, length: distance };
          dataset.edges.push(newEdge);
          // select the new link
          selectedLink = newEdge;
        }
      }

      selectedNode = null;
      update();
    })

  // show node IDs
  rectContainer.append("svg:text")
    .attr("dy", "-0.5em")
    .attr("dx", function (d) { return d.w / 2 })
    .attr("class", "id")
    .text((d) => d.name);

  rect = rectContainer.merge(rect);
}


/////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS FOR UPDATES //
/////////////////////////////////////////////////////////////////////////////////

// Updates force layout (called automatically each iteration)
function tick() {
  // update the links
  path.select(".link").attr("d", function(d) {return getPath(d, 0)});
  // update the link labels
  path.select(".linklabel").attr("transform", function(d) {
    if (d.target.x<d.source.x){
                bbox = this.getBBox();
                rx = bbox.x+bbox.width/2;
                ry = bbox.y+bbox.height/2;
                return "rotate(180 "+rx+" "+ry+")";
                }
            else {
                return "rotate(0)";
                }
  });
  
  // update dummy links
  dummyPath.select(".link").attr("d", function(d) {return getPath(d, 1)});
  // update dummy link labels
  dummyPath.select(".linklabel").attr("transform", function(d) {
    if (d.target.x<d.source.x){
                bbox = this.getBBox();
                rx = bbox.x+bbox.width/2;
                ry = bbox.y+bbox.height/2;
                return "rotate(180 "+rx+" "+ry+")";
                }
            else {
                return "rotate(0)";
                }
  });

  // update nodes
  rect.attr("transform", (d) => `translate(${d.x - (d.w/2)},${d.y - (d.h)/2})`); 
}

// Gets the proper arc & padding for each path/link
function getPath(d, num) {
  const deltaX = d.target.x - d.source.x;
  const deltaY = d.target.y - d.source.y;
  const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const normX = deltaX / dist;
  const normY = deltaY / dist;

  var sourcePadding;
  var targetPadding;
  if(d.left) {
    sourcePadding = d.source.w > d.source.h ? (d.source.w / 2) + 10 : (d.source.h / 2) + 10
  }
  else {
    sourcePadding = d.source.w > d.source.h ? d.source.w / 2 : d.source.h / 2
  }
  if(d.right) {
    targetPadding = d.target.w > d.target.h ? (d.target.w / 2) + 10 : (d.target.h / 2) + 10
  }
  else {
    targetPadding = d.target.w > d.target.h ? d.target.w / 2 : d.target.h / 2
  }

  var sourceX = d.source.x + (sourcePadding * normX);
  var sourceY = d.source.y + (sourcePadding * normY);
  var targetX = d.target.x - (targetPadding * normX);
  var targetY = d.target.y - (targetPadding * normY);
  const dr = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  if(num==0 || num==1) {  
    return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0," + num + " " + targetX + "," + targetY;  
  }
  else {return "M" + sourceX + " " + sourceY + "L" + targetX + " " + targetY}
}


// This returns the proper marker arrows for each path & dummyPath
function getMarkers(d, isDummyPath, isStart) {
  // if doubly linked
  if(d.left && d.right) {
    // if marker-start
    if(isStart) {
      // then we want path to have an arrow 
      if(!isDummyPath) { return "url(#start-arrow)";}
      // and dummyPath to have nothing
      else { return ""}
    }
    // otherwise marker-end
    else {
      // we want dummyPath to have an arrow 
      if(!isDummyPath) { return "";}
      // and path to have nothing
      else { return "url(#end-arrow)"}
    }
  }
  // otherwise it"s singly linked
  else {
    // marker-start
    if(isStart) {
      if(d.left) { return "url(#start-arrow)"}
      else { return ""}
    }
    //marker-end
    else{
      if(d.right) { return "url(#end-arrow)"}
      else { return ""}
    }
  }
}


/////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS FOR MOUSE AND KEY EVENTS //
/////////////////////////////////////////////////////////////////////////////////

function mousedown() {
  // because :active only works in WebKit?
  svg.classed("active", true);

  if (d3.event.shiftKey || mousedownNode || mousedownLink) return;

  else if (d3.event.ctrlKey) {
    // insert new node at point
    const point = d3.mouse(this);
    
    var text = prompt("What do you want to name the new Node?");
    
    if(text !== null){
    
      const node = { id: ++lastNodeId, name: text, h: 50, w: 50, reflexive: false, x: point[0], y: point[1] };
      dataset.nodes.push(node);

      update(); 
    }

    svg.classed("ctrl", false);
  }
  
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr("d", `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);

  update();
}

function mouseup() {
  
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed("hidden", true)
      .style("marker-end", "");
  }

  // because :active only works in WebKit?
  svg.classed("active", false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = dataset.edges.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    dataset.edges.splice(dataset.edges.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // shift
  if (d3.event.keyCode === 16) {
    rect.call(drag);
    svg.classed("shift", true);
  }

  if (!selectedNode && !selectedLink) return;

  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if (selectedNode) {
        dataset.nodes.splice(dataset.nodes.indexOf(selectedNode), 1);
        spliceLinksForNode(selectedNode);
      } else if (selectedLink) {
        dataset.edges.splice(dataset.edges.indexOf(selectedLink), 1);
      }
      selectedLink = null;
      selectedNode = null;
      update();
      break;
    case 66: // B
      if (selectedLink) {
        // check for null cost
        if (selectedLink.leftCost === null || selectedLink.rightCost === null) {
          var edgeType;
          if(!selectedLink.left) edgeType = "left";
          else edgeType = "right";
          var newCost = prompt("What is the cost of this " + edgeType + " edge?");
         
          if(newCost === null) break;
          else {
            while(isNaN(newCost)) newCost = prompt("What is the cost of this " + edgeType + " edge?");
            if(newCost === null) break;
            if(selectedLink.rightCost === null) selectedLink.rightCost = Number(newCost);
            else selectedLink.leftCost = Number(newCost);
          }
        }
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      update();
      break;
    case 76: // L
      if (selectedLink) {

        if(selectedLink.leftCost === null) {
          var newCost = prompt("What is the cost of this left edge?");
          if(newCost === null) break;
          else{
            while(isNaN(newCost)) newCost = prompt("What is the cost of this left edge?");
            if(newCost === null) break;
            selectedLink.leftCost = Number(newCost); 
          }
        }
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      update();
      break;
    case 82: // R
      if (selectedNode) {
        // toggle node reflexivity
        selectedNode.reflexive = !selectedNode.reflexive;
      } else if (selectedLink) {

        if(selectedLink.rightCost === null) {
          var newCost = prompt("What is the cost of this right edge?");
          if(newCost === null) break;
          else{
            while(isNaN(newCost)) newCost = prompt("What is the cost of this right edge?");
            if(newCost === null) break;
            selectedLink.rightCost = Number(newCost);  
          }
        }
        // set link direction to right only
        selectedLink.left = false;
        selectedLink.right = true;   
      }
      update();
      break;    
  }
}

function keyup() {
  lastKeyDown = -1;

  // shift
  if (d3.event.keyCode === 16) {
    rect.on(".drag", null);
    svg.classed("shift", false);
  }
}


/////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS FOR TOOLBOX //
/////////////////////////////////////////////////////////////////////////////////

// handle download data
d3.select("#download-input").on("click", function(){
      var saveEdges = [];
      dataset.edges.forEach(function(d, i){
        saveEdges.push({ id: d.id, source: d.source.id, target: d.target.id, leftCost: d.leftCost, rightCost: d.rightCost, left: d.left, right: d.right, length: d.length});
      });
      var blob = new Blob([window.JSON.stringify({"nodes": dataset.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
      saveAs(blob, "myData.json");
});

d3.select("#delete-graph").on("click", function(){ 
  var doDelete = true;
  doDelete = window.confirm("Press OK to delete this graph");
  if(doDelete) {
    dataset.nodes = [];
    dataset.edges = [];
    lastNodeId = -1; 
    lastEdgeId = -1;
    update();
  }
});


/////////////////////////////////////////////////////////////////////////////////
// APP STARTS HERE //
/////////////////////////////////////////////////////////////////////////////////

svg.on("mousedown", mousedown)
  .on("mousemove", mousemove)
  .on("mouseup", mouseup);
d3.select(window)
  .on("keydown", keydown)
  .on("keyup", keyup);
update();

// jQuery for control+click
$(document).ready(function(){
  $(document).on("keydown", function (event) {
    if (event.ctrlKey) {
        $("svg").css("cursor", "cell");
    }
  });
  $(document).on("mouseup", function (event) {
    if (!event.ctrlKey) {
        $("svg").css("cursor", "default");
    }
  });  

  $(document).on("keyup", function(event) {
    if (!event.ctrlKey) {
        $("svg").css("cursor", "default");
    }
  });
  
});
