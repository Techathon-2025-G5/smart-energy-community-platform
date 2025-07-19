import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import api from '../api/client';
import { parseLog } from '../utils/log';
import './EnergyBalance.css';

export default function EnergyBalance({ step }) {
  const [points, setPoints] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const log = await api.getLog();
        const parsed = parseLog(log);
        const bal = parsed.balance?.[0] || {};
        const gens = bal.overall_provided_to_microgrid || {};
        const cons = bal.overall_absorbed_from_microgrid || {};
        const steps = Object.keys(gens)
          .map(Number)
          .sort((a, b) => a - b);
        const newPoints = steps.map((s) => ({
          generation: Number(gens[s] || 0),
          consumption: Number(cons[s] || 0),
        }));
        setPoints(newPoints);
      } catch (_) {
        // ignore
      }
    };
    fetchData();
  }, [step]);

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

EnergyBalance.propTypes = {
  step: PropTypes.number.isRequired,
};
