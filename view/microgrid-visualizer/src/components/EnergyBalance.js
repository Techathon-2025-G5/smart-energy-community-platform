import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import api from '../api/client';
import './EnergyBalance.css';

export default function EnergyBalance() {
  const [points, setPoints] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const status = await api.getStatus();
        const generation = status?.renewable?.[0]?.renewable_current || 0;
        const consumption = Math.abs(status?.load?.[0]?.load_current || 0);
        setPoints((p) => [...p.slice(-19), { generation, consumption }]);
      } catch (err) {
        // ignore errors silently
      }
    };
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 400;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(points.length - 1, 5)])
      .range([margin.left, width - margin.right]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(points, (d) => Math.max(d.generation, d.consumption)) || 1])
      .range([height - margin.bottom, margin.top]);

    const lineGen = d3
      .line()
      .x((d, i) => x(i))
      .y((d) => y(d.generation));

    const lineCon = d3
      .line()
      .x((d, i) => x(i))
      .y((d) => y(d.consumption));

    svg.append('path').datum(points).attr('fill', 'none').attr('stroke', 'green').attr('d', lineGen);
    svg.append('path').datum(points).attr('fill', 'none').attr('stroke', 'red').attr('d', lineCon);
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));
  }, [points]);

  const last = points[points.length - 1] || { generation: 0, consumption: 0 };

  return (
    <div className="energy-balance">
      <svg ref={svgRef}></svg>
      <div className="totals">
        <span>Generación: {last.generation.toFixed(2)} kWh</span>
        <span>Consumo: {last.consumption.toFixed(2)} kWh</span>
      </div>
    </div>
  );
}
