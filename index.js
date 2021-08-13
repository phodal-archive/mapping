var chart = function (data) {
    let width = 900
    let height = 600
    let color = function () {
        const scale = d3.scaleOrdinal(d3.schemeCategory10);
        return d => scale(d.group);
    }

     let drag = function(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select("svg")
        .attr("viewBox", [0, 0, width, height]);

    let g = svg.append("g");
    const link = g
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    function zoomed({transform}) {
        g.attr("transform", transform);
    }

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1/8, 64])
        .on("zoom", zoomed));

    const node = g
        .attr("fill", "currentColor")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation));

    node.append("circle")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("r", 5)
        .attr('fill', color());

    node.append("text")
        .attr("x", 30 + 4)
        .attr("y", "0.31em")
        .text(d => d.id)
        .clone(true).lower()
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 3);

    node.on('dblclick', (e, d) => console.log(nodes[d.index]))

    simulation.on("tick", () => {
        // link.attr("d", linkArc);
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // invalidation.then(() => simulation.stop());

    return svg.node();
}

d3.csv("/data/sponsee.csv").then(data => {
    let sponsors = {}
    let links = [];
    let nodes = [];
    let nodes_map = {}

    for (let item of data) {
        let sponseeName = item["Sponsee"];
        let sponsorName = item["Sponsor"];

        nodes_map[sponseeName] = 1;
        nodes_map[sponsorName] = 1;

        if(sponsorName === "") {
            continue;
        }

        if(sponsors[sponsorName]) {
            sponsors[sponsorName]++
        } else {
            sponsors[sponsorName] = 1
        }
        links.push({
            source: sponseeName,
            target: sponsorName,
            value: 1
        })
    }

    for (let sponsor in nodes_map) {
        nodes.push({
            id: sponsor,
            group: sponsors[sponsor]
        })
    }

    chart({
        nodes,
        links
    });
});
