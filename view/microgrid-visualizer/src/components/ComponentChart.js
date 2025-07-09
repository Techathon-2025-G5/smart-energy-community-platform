import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ComponentChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 400;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(data.length - 1, 5)])
      .range([margin.left, width - margin.right]);
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.value) ?? 0,
        d3.max(data, (d) => d.value) ?? 1,
      ])
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line()
      .x((d, i) => x(i))
      .y((d) => y(d.value));

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('d', line);

    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));
  }, [data]);

  return <svg ref={svgRef}></svg>;
}
