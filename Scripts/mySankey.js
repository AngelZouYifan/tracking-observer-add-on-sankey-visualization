"use strict";


/* Global Variables */
var svg;
var test_data = {"nodes":[{"node":0, "name":"python-graph-gallery.com"},
	{"node":1, "name": "d3-graph-gallery.com"},
	{"node":2, "name": "code.grepper.com"},
	{"node":3, "name": "ezoic.net-referredby-ezojs.com"},
	{"node":4, "name": "google.com-referredby-ezojs.com"},
	{"node":5, "name": "google-analytics.com-referredby-ezojs.com"},
    {"node":6,"name":"google-analytics.com-referredby-googletagmanager.com"},
    {"node":7,"name":"bloomberg.com"},
    {"node":8,"name":"doubleclick.net-referredby-googletagmanager.com"},
    {"node":9,"name":"google-analytics.com"}
	], "links": [{"source": 0,"target":3,"value":1},
	{"source":1,"target":3,"value":1},
	{"source":2,"target":3,"value":1},
	{"source":0,"target":4,"value":1},
	{"source":1,"target":4,"value":1},
	{"source":2,"target":4,"value":1},
	{"source":0,"target":5,"value":1},
	{"source":1,"target":5,"value":1},
    {"source":7,"target":6,"value":1},
    {"source":7,"target":8,"value":1},
    {"source":2,"target":8,"value":1},
    {"source":5,"target":9,"value":1},
    {"source":6,"target":9,"value":1}
]}	// small dataset for testing

function initialize() {
    var to_id = "obheeflpdipmaefcoefhimnaihmhpkao";	// Tracking Observer
    
	chrome.runtime.sendMessage(to_id, {type : 'getTrackers'},
		function(trackers) {
            		finishInitialize(trackers);
		});
}

function finishInitialize(trackers) {
	
	// var sankeydata = convert2sankey(trackers);		// tracker data to sankeyformat
	// downloadObjectAsJson(sankeydata,"sankeydata");	// download
	graph_sankey(test_data);	// work with 10 or less nodes currently
}

window.onload = initialize;

// Save tracker data to JSON format required by sankey
function convert2sankey(trackers) {
	var node_names = []; // names
	var links = [];	// source, target, value
    for (var tracker in trackers) {
		node_names.push(trackers[tracker].domain);
		for (var idx in trackers[tracker].trackedSites) {
			node_names.push(trackers[tracker].trackedSites[idx]);
			links.push({
				source: trackers[tracker].trackedSites[idx],
				target: trackers[tracker].domain,
				value: 1
			});
		};
	}
	var nodes = uniqueNodes(node_names);
	var sankeydata = names2indices(nodes, links);
	return sankeydata;
}

// Get unique indexed nodes
function uniqueNodes(node_names) {
	var name_lookup = {};
	var nodes = [];
	var node_idx = 0;
	for (var name, i = 0; name = node_names[i++];) {
	  	if (!(name in name_lookup)) {
			name_lookup[name] = 1;
			nodes.push({node:node_idx, name:name});
			node_idx+=1;
	  	}
	}
	return nodes
}

// Replace name reference with index reference
function names2indices(nodes, links) {	
	var nodeMap = {}
	nodes.forEach(function(x) {nodeMap[x.name] = x.node;});
	links = links.map(function(x) {
		return {
			source: nodeMap[x.source],
			target: nodeMap[x.target],
			value: x.value
		};
	});	
	var data = {"nodes": nodes, "links": links};
	return data;
}

// function getDomain(url) {	// not working 
// 	var    a      = new URL(url)
// 	return a.hostname.replace('www','');
// }
 
// graph sankey with d3 v7
// modeled after https://bl.ocks.org/d3noob/31665aced416f27abca4fa46f5f4b568
function graph_sankey(data) { 
	// set the dimensions and margins of the graph
	var margin = {top: 30, right: 30, bottom: 30, left: 30}
	var width = window.innerWidth - margin.left - margin.right
	var height = window.innerHeight- margin.top - margin.bottom
	// format variables
	var formatNumber = d3.format(",.0f"), // zero decimal places
	format = function(d) { return formatNumber(d); },
	color = d3.scaleOrdinal(d3.schemeCategory10);
	// append the svg object to the body of the page
	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", 
		"translate(" + margin.left + "," + margin.top + ")");
	var sankey = d3.sankey()
		.nodeWidth(36)
		.nodePadding(40)
		.size([width, height]);
	var path = sankey.links();
	var graph = sankey(data);
	// add in the links
	var link = svg.append("g").selectAll(".link")
		.data(graph.links)
		.enter().append("path")
		.attr("class", "link")
		.attr("d", d3.sankeyLinkHorizontal())
		.attr("stroke-width", function(d) { return d.width; });  
	// // add the link titles       // not working
	//   link.append("title")
	//         .text(function(d) {
	//     		    return d.source.name + " → " + 
	//                 d.target.name + "\n" + format(d.value); });
	// add in the nodes
	var node = svg.append("g").selectAll(".node")
		.data(graph.nodes)
		.enter().append("g")
		.attr("class", "node") // next: add drag and move functionality
	// add the rectangles for the nodes
	node.append("rect")
		.attr("x", function(d) { return d.x0; })
		.attr("y", function(d) { return d.y0; })
		.attr("height", function(d) { return d.y1 - d.y0; })
		.attr("width", sankey.nodeWidth())
		.style("fill", function(d) { 
				return d.color = color(d.name.replace(/ .*/, "")); })
		.style("stroke", function(d) { 
			return d3.rgb(d.color).darker(2); })
		.append("title")
		.text(function(d) { 
			return d.name + "\n" + format(d.value); });
	// add in the title for the nodes
	node.append("text")
		.attr("x", function(d) { return d.x0 - 6; })
		.attr("y", function(d) { return (d.y1 + d.y0) / 2; })
		.attr("dy", "0.35em")
		.attr("text-anchor", "end")
		.text(function(d) { return d.name; })
		.filter(function(d) { return d.x0 < width / 2; })
		.attr("x", function(d) { return d.x1 + 6; })
		.attr("text-anchor", "start");
}


// // Debugging tool found online
// function downloadObjectAsJson(exportObj, exportName){
// 	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
// 	var downloadAnchorNode = document.createElement('a');
// 	downloadAnchorNode.setAttribute("href",     dataStr);
// 	downloadAnchorNode.setAttribute("download", exportName + ".json");
// 	document.body.appendChild(downloadAnchorNode); // required for firefox
// 	downloadAnchorNode.click();
// 	downloadAnchorNode.remove();
// }