import * as d3 from 'd3';
import { AutomataSelection, State } from './types';

const width = 600, height = 500;
const circle_radius = 25;


export const setup_graph = (showing: AutomataSelection) => {
  // Clear title
  const page = d3.select('#page');
  page.select('h1').remove();

  // Select SVG
  const svg = page.select('#svgPane')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  // Clear previous graphs
  svg.selectAll('*').remove();

  // Append defs
  const defs = svg.append('defs');

  // Add #arrowhead
  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', circle_radius + 3)
    .attr('orient', 'auto')
    .attr('markerWidth', 13)
    .attr('markerHeight', 13)
    .append('path')
    .attr('d', 'M0,-5 L10,0 L0,5');

  // Add #arrowhead-self
  defs.append('marker')
    .attr('id', 'arrowhead-self')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', circle_radius - 6)
    .attr('refY', 8)
    .attr('orient', 165)
    .attr('markerWidth', 13)
    .attr('markerHeight', 13)
    .append('path')
    .attr('d', 'M0,-5 L10,0 L0,5');

  // Add lines to links
  const edgepaths = svg.selectAll('.edgepath')
    .data(window[showing].transitions)
    .enter()
    .append('path')
    .attr('class', 'edgepath')
    .attr('fill-opacity', 0)
    .attr('stroke', '#000')
    .attr('id', (_, i) => `edgepath${i}`)
    .attr('marker-end', d => `url(#arrowhead${d.source === d.target ? '-self' : ''})`)
    .style('pointer-events', 'none');

  // Add titles to links
  const edgelabels = svg.selectAll('.edgelabel')
    .data(window[showing].transitions)
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

  // Add nodes
  const node = svg.selectAll('.node')
  
    .data(window[showing].states)
    .enter()
    .append('g')
    .attr('class', 'node');

  svg.selectAll('g').filter(node => (node as State).name=='q0').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', circle_radius + 10)
    .attr('orient', 'auto')
    .attr('markerWidth', 30)
    .attr('markerHeight', 30)
    //.append('path')
    //.attr('d', 'M0,-5 L10,0 L0,5');

  node.append('circle')
    .attr('fill', 'lightgreen')
    .attr('r', circle_radius)
    .attr('stroke', 'black')
  /*svg.selectAll('g.node')
    .each(function(d,i){
      if((d as State).is_finishing_state){

      }
    });*/
  const finishingStates=svg.selectAll('g').filter(node => (node as State).is_finishing_state==true)
  finishingStates.append('circle')
    .attr('fill', 'lightgreen')
    .attr('r', circle_radius-5)
    .attr('stroke', 'black')
  
  //console.log(finishingStates)
  node.append('text')
    .attr('dy', 5)
    .attr('text-anchor', 'middle')
    .text(d => d.name);

  // Add force simulation
  d3.forceSimulation(window[showing].states)
    .force('link', d3.forceLink(window[showing].transitions).distance(300).strength(1))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', () => {
      node.attr('transform', d => `translate(${d.x},${d.y})`);

      edgepaths.attr('d', d => {
        const s = (d.source as State), t = (d.target as State);
        const r = Math.hypot(t.x - s.x, t.y - s.y);
        return r === 0
          ? `M${s.x + 10},${s.y - 10}
            A20,20,0,1,1,${s.x + 40},${s.y - 40}
            A20,20,0,1,1,${s.x + 10},${s.y - 10}`
          : `M ${s.x},${s.y} A${r},${r},0,0,1,${t.x},${t.y}`;
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
    });
};
