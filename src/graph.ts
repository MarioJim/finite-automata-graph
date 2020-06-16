import * as d3 from './d3bundle';
import { AutomataSelection, State } from './types';

const width = 600;
const height = 500;
const circleRadius = 25;
const initStateTriangleSize = 16;

export const displayGraphs = () => {
  const automatas: AutomataSelection[] = [
    'originalNFA',
    'convertedDFA',
    'minimizedDFA',
  ];
  automatas.forEach((automataName, index) => {
    setupGraph(automataName, index + 1);
  });
};

const setupGraph = (automataName: AutomataSelection, panelNum: number) => {
  // Select page
  const page = d3.select(`#page${panelNum}`);
  page.style('display', 'block');

  // Select pane title
  page.select('.pane-title').style('display', 'block');

  // Select SVG
  const svg = page
    .select('.svg-pane')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  // Clear previous graphs
  svg.selectAll('*').remove();

  // Append defs
  const defs = svg.append('defs');

  // Add #arrowhead
  defs
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', circleRadius + 3)
    .attr('orient', 'auto')
    .attr('markerWidth', 13)
    .attr('markerHeight', 13)
    .append('path')
    .attr('d', 'M0,-5 L10,0 L0,5');

  // Add #arrowhead-self
  defs
    .append('marker')
    .attr('id', 'arrowhead-self')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', circleRadius - 6)
    .attr('refY', 8)
    .attr('orient', 165)
    .attr('markerWidth', 13)
    .attr('markerHeight', 13)
    .append('path')
    .attr('d', 'M0,-5 L10,0 L0,5');

  // Add lines to links
  const edgepaths = svg
    .selectAll('.edgepath')
    .data(window[automataName].transitions)
    .enter()
    .append('path')
    .attr('class', '.edgepath')
    .attr('fill-opacity', 0)
    .attr('stroke', '#000')
    .attr('id', (_, i) => `edgepath${panelNum}-${i}`)
    .attr(
      'marker-end',
      (d) => `url(#arrowhead${d.source === d.target ? '-self' : ''})`,
    )
    .style('pointer-events', 'none');

  // Add titles to links
  const edgelabels = svg
    .selectAll('.edgelabel')
    .data(window[automataName].transitions)
    .enter()
    .append('text')
    .attr('dy', -3)
    .attr('class', '.edgelabel')
    .attr('font-size', 10)
    .style('pointer-events', 'none');

  edgelabels
    .append('textPath')
    .attr('href', (_, i) => `#edgepath${panelNum}-${i}`)
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .attr('fill', 'black')
    .text((d) => d.symbol);

  // Add nodes
  const node = svg
    .selectAll('.node')
    .data(window[automataName].states)
    .enter()
    .append('g')
    .attr('class', 'node');

  node
    .append('circle')
    .attr('fill', 'lightgreen')
    .attr('r', circleRadius)
    .attr('stroke', 'black');

  node
    .filter((node) => node.isFinalState)
    .append('circle')
    .attr('fill', 'lightgreen')
    .attr('r', circleRadius - 5)
    .attr('stroke', 'black');

  node
    .append('text')
    .attr('dy', 5)
    .attr('text-anchor', 'middle')
    .text((d) => d.name);

  node
    .filter((node) => node.name === window[automataName].initialState)
    .append('polygon')
    .attr('stroke', 'black')
    .attr('fill', 'white')
    .attr(
      'points',
      `-${circleRadius + initStateTriangleSize},${initStateTriangleSize} -${
        circleRadius + initStateTriangleSize
      },-${initStateTriangleSize} -${circleRadius},0`,
    );

  // Add force simulation
  const forceSim = d3
    .forceSimulation(window[automataName].states)
    .force(
      'link',
      d3
        .forceLink(window[automataName].transitions)
        .distance(220)
        .strength(0.8),
    )
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', () => {
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);

      edgepaths.attr('d', (d) => {
        const s = d.source as State,
          t = d.target as State;
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
  const dragFunction = d3
    .drag()
    .on('start', (node: State) => {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active) forceSim.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    })
    .on('drag', (node: State) => {
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    })
    .on('end', (node: State) => {
      if (!d3.event.active) forceSim.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    });
  node.call(dragFunction);
};
