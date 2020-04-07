import * as d3 from 'd3';
import { State } from './types';

const width = 800, height = 600;
const circle_radius = 18;

export const setup_graph = () => {
  // Clear title
  const page = d3.select('#page');
  page.select('h1').remove();

  // Select SVG
  const svg = page.select('#svgPane')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  // Clear previous graphs
  svg.selectAll('.edgepath').remove();
  svg.selectAll('.edgelabel').remove();
  svg.selectAll('.node').remove();

  // Add lines to links
  const edgepaths = svg.selectAll('.edgepath')
    .data(window.automata.transitions)
    .enter()
    .append('path')
    .attr('class', 'edgepath')
    .attr('fill-opacity', 0)
    .attr('stroke', '#000')
    .attr('id', (_, i) => `edgepath${i}`)
    .attr('marker-end', 'url(#arrowhead)')
    .style('pointer-events', 'none');

  // Add titles to links
  const edgelabels = svg.selectAll('.edgelabel')
    .data(window.automata.transitions)
    .enter()
    .append('text')
    .attr('class', 'edgelabel')
    .attr('font-size', 10)
    .attr('id', (_, i) => `edgelabel${i}`)
    .style('pointer-events', 'none');

  edgelabels.append('textPath')
    .attr('href', (_, i) => `#edgepath${i}`)
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .attr('fill', 'black')
    .text(d => d.symbol);

  const node = svg.selectAll('.node')
    .data(window.automata.states)
    .enter()
    .append('g')
    .attr('class', 'node');

  node.append('circle').attr('r', circle_radius);

  node.append('title').text(d => d.name);

  node.append('text').attr('dy', -circle_radius).attr('dx', circle_radius).text(d => d.name);

  const ticked = () => {
    node.attr('transform', d => `translate(${d.x},${d.y})`);

    edgepaths.attr('d', d => {
      const s = (d.source as State), t = (d.target as State);
      const r = Math.hypot(t.x - s.x, t.y - s.y);
      return `M ${s.x},${s.y} A${r},${r} 0 0,1 ${t.x},${t.y}`;
    });

    edgelabels.attr('transform', (d, i, nodes) => {
      if ((d.target as State).x < (d.source as State).x) {
        const bbox = nodes[i].getBBox();
        const rx = bbox.x + bbox.width / 2;
        const ry = bbox.y + bbox.height / 2;
        return `rotate(180 ${rx} ${ry})`;
      }
      return 'rotate(0)';
    });
  };

  d3.forceSimulation(window.automata.states)
    .force('link', d3.forceLink(window.automata.transitions).distance(300).strength(1))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked);
};
