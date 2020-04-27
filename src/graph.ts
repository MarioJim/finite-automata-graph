import * as d3 from 'd3';
import { AutomataSelection, State } from './types';

const width = 600, height = 500;
const circle_radius = 25;

export const display_graphs = () => {
  const automatas: AutomataSelection[] = ['original_NFA', 'converted_DFA', 'minimized_DFA'];
  automatas.forEach((automata_name, index) => {
    setup_graph(automata_name, index + 1);
  });
};

const setup_graph = (automata_name: AutomataSelection, panelNum: number) => {
  // Clear title
  const page = d3.select(`#page${panelNum}`);
  page.select('h1').remove();
  page.style('display', 'block');

  // Select pane title
  page.select('.paneTitle').style('display', 'block');

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
    .data(window[automata_name].transitions)
    .enter()
    .append('path')
    .attr('class', '.edgepath')
    .attr('fill-opacity', 0)
    .attr('stroke', '#000')
    .attr('id', (_, i) => `edgepath${panelNum}-${i}`)
    .attr('marker-end', d => `url(#arrowhead${d.source === d.target ? '-self' : ''})`)
    .style('pointer-events', 'none');

  // Add titles to links
  const edgelabels = svg.selectAll('.edgelabel')
    .data(window[automata_name].transitions)
    .enter()
    .append('text')
    .attr('dy', -3)
    .attr('class', '.edgelabel')
    .attr('font-size', 10)
    .style('pointer-events', 'none');

  edgelabels.append('textPath')
    .attr('href', (_, i) => `#edgepath${panelNum}-${i}`)
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .attr('fill', 'black')
    .text(d => d.symbol);

  // Add nodes
  const node = svg.selectAll('.node')
    .data(window[automata_name].states)
    .enter()
    .append('g')
    .attr('class', 'node');

  node.append('circle')
    .attr('fill', 'lightgreen')
    .attr('r', circle_radius)
    .attr('stroke', 'black');

  node.filter(node => node.is_final_state)
    .append('circle')
    .attr('fill', 'lightgreen')
    .attr('r', circle_radius - 5)
    .attr('stroke', 'black');

  node.append('text')
    .attr('dy', 5)
    .attr('text-anchor', 'middle')
    .text(d => d.name);

  const init_state_triangle_size = 16;
  node.filter(node => node.name === window[automata_name].initial_state)
    .append('polygon')
    .attr('stroke', 'black')
    .attr('fill', 'white')
    .attr('points', `-${circle_radius + init_state_triangle_size},${init_state_triangle_size} -${circle_radius + init_state_triangle_size},-${init_state_triangle_size} -${circle_radius},0`);

  // Add force simulation
  const force_sim = d3.forceSimulation(window[automata_name].states)
    .force('link', d3.forceLink(window[automata_name].transitions).distance(220).strength(0.8))
    .force('charge', d3.forceManyBody().strength(-400))
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

  // Add mouse drag to the nodes
  const drag_function = d3.drag()
    .on('start', (node: State) => {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active)
        force_sim.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    })
    .on('drag', (node: State) => {
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    })
    .on('end', (node: State) => {
      if (!d3.event.active)
        force_sim.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    });
  node.call(drag_function);
};
