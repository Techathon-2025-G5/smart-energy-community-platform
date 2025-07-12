import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import './SolarStatus.css';
import './StatusCommon.css';

function SocBar({ value }) {
  return (
    <div className="soc-bar">
      <div
        className="soc-fill"
        style={{ height: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

function RenewableAreaChart({ usedData, curtailedData, max, steps }) {
  const ref = useRef(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = 300;
    const height = 180;
    const margin = { top: 20, right: 10, bottom: 30, left: 30 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(usedData.length - 1, 5)])
      .range([margin.left, width - margin.right]);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        max || d3.max(usedData.map((d, i) => d + (curtailedData[i] || 0))) || 1,
      ])
      .range([height - margin.bottom, margin.top]);

    const areaUsed = d3
      .area()
      .x((d, i) => x(i))
      .y0(y(0))
      .y1((d) => y(d));

    const areaCurtail = d3
      .area()
      .x((d, i) => x(i))
      .y0((d, i) => y(usedData[i] || 0))
      .y1((d, i) => y((usedData[i] || 0) + d));

    svg.append('path').datum(curtailedData).attr('fill', '#ec3137').attr('d', areaCurtail);
    svg.append('path').datum(usedData).attr('fill', '#74971a').attr('d', areaUsed);
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
    const tickIndices = (() => {
      if (!steps) return x.ticks(5);
      const days = steps.map((s) => Math.floor(s / 24) + 1);
      const dayBoundaries = days
        .map((day, idx) => ({ day, idx }))
        .filter((d, i, arr) => i === 0 || d.day !== arr[i - 1].day)
        .map((d) => d.idx);
      const stepSize = Math.max(1, Math.ceil(dayBoundaries.length / 7));
      return dayBoundaries.filter((_, i) => i % stepSize === 0);
    })();
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(tickIndices)
          .tickFormat((d) => (steps ? Math.floor(steps[d] / 24) + 1 : d))
      );
  }, [usedData, curtailedData, max, steps]);

  return <svg ref={ref}></svg>;
}

function RewardChart({ data, steps }) {
  const ref = useRef(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = 300;
    const height = 180;
    const margin = { top: 20, right: 10, bottom: 30, left: 30 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(data.length - 1, 5)])
      .range([margin.left, width - margin.right]);
    const barWidth = (width - margin.left - margin.right) / Math.max(data.length, 1);
    const y = d3
      .scaleLinear()
      .domain([
        Math.min(0, d3.min(data) || 0),
        Math.max(0, d3.max(data) || 1),
      ])
      .range([height - margin.bottom, margin.top]);

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (_, i) => x(i) - barWidth / 2)
      .attr('y', (d) => (d >= 0 ? y(d) : y(0)))
      .attr('height', (d) => Math.abs(y(d) - y(0)))
      .attr('width', barWidth - 1)
      .attr('fill', (d) => (d >= 0 ? '#74971a' : '#ec3137'));

    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
    const tickIndices = (() => {
      if (!steps) return x.ticks(5);
      const days = steps.map((s) => Math.floor(s / 24) + 1);
      const dayBoundaries = days
        .map((day, idx) => ({ day, idx }))
        .filter((d, i, arr) => i === 0 || d.day !== arr[i - 1].day)
        .map((d) => d.idx);
      const stepSize = Math.max(1, Math.ceil(dayBoundaries.length / 7));
      return dayBoundaries.filter((_, i) => i % stepSize === 0);
    })();
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(tickIndices)
          .tickFormat((d) => (steps ? Math.floor(steps[d] / 24) + 1 : d))
      );
  }, [data, steps]);

  return <svg ref={ref}></svg>;
}

export default function SolarStatus({ module, history, currentState }) {
  const idx = module.backendId ? parseInt(module.backendId.split('_')[1], 10) + 1 : 1;
  const stepSet = new Set([
    ...Object.keys(history.renewable_current || {}),
    ...Object.keys(history.reward || {}),
  ]);
  const steps = Array.from(stepSet)
    .map(Number)
    .sort((a, b) => a - b);
  const usedHist = steps.map((s) => Math.max(0, Number(history.renewable_used?.[s] || 0)));
  const curtailedHist = steps.map((s) => Math.max(0, Number(history.curtailment?.[s] || 0)));
  const rewardHist = steps.map((s) => Number(history.reward?.[s] || 0));
  const availableHist = steps.map((s) => Number(history.renewable_current?.[s] || 0));
  const maxAvail = availableHist.length ? Math.max(...availableHist) : 1;

  const available = Math.max(0, Number(currentState.renewable_current || 0));
  const used = Math.max(0, Number(currentState.renewable_used || 0));
  const usedFrac = available > 0 ? Math.min(used / available, 1) : 0;

  return (
    <div className="solar-status">
      <h3>Solar Panel {idx}</h3>
      <div className="solar-grid">
        <div className="available-value">
          <div className="value" style={{ color: 'var(--blue)' }}>
            {available.toFixed(2)} kWh
          </div>
          <div className="label">Available</div>
        </div>
        <div className="used-value">
          <div className="value" style={{ color: 'var(--green)' }}>
            {used.toFixed(2)} kWh
          </div>
          <div className="label">Used</div>
        </div>
        <div className="soc-graph">
          <SocBar value={usedFrac} />
          <div className="label">Used</div>
        </div>
        <div className="charge-graph">
          <div className="label">Generation History</div>
          <RenewableAreaChart
            usedData={usedHist}
            curtailedData={curtailedHist}
            max={maxAvail}
            steps={steps}
          />
        </div>
        <div className="reward-graph">
          <div className="label">Reward History</div>
          <RewardChart data={rewardHist} steps={steps} />
        </div>
      </div>
    </div>
  );
}

SolarStatus.propTypes = {
  module: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
