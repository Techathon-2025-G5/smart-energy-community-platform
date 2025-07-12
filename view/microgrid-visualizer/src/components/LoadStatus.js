import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import './LoadStatus.css';
import './StatusCommon.css';
function SocBar({ value }) {
  return (
    <div className="soc-bar">
      <div className="soc-fill" style={{ height: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

function LoadAreaChart({ metData, unmetData, max, steps }) {
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
    .domain([0, Math.max(metData.length - 1, 5)])
    .range([margin.left, width - margin.right]);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        max ||
          d3.max(metData.map((d, i) => d + (unmetData[i] || 0))) ||
          1,
      ])
      .range([height - margin.bottom, margin.top]);

  const areaMet = d3
    .area()
    .x((d, i) => x(i))
    .y0(y(0))
    .y1((d) => y(d));

  const areaUnmet = d3
    .area()
    .x((d, i) => x(i))
    .y0((d, i) => y(metData[i] || 0))
    .y1((d, i) => y((metData[i] || 0) + d));

  svg.append('path').datum(unmetData).attr('fill', '#ec3137').attr('d', areaUnmet);
  svg.append('path').datum(metData).attr('fill', '#74971a').attr('d', areaMet);
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
  }, [metData, unmetData, max, steps]);

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

export default function LoadStatus({ module, history, currentState }) {
  const idx = module.backendId ? parseInt(module.backendId.split('_')[1], 10) + 1 : 1;
  const stepSet = new Set([
    ...Object.keys(history.load_current || {}),
    ...Object.keys(history.reward || {}),
  ]);
  const steps = Array.from(stepSet)
    .map(Number)
    .sort((a, b) => a - b);
  const requestedHist = steps.map((s) => Math.abs(Number(history.load_current?.[s] || 0)));
  const metHist = steps.map((s) => Math.max(0, Number(history.load_met?.[s] || 0)));
  const unmetHist = requestedHist.map((r, i) => Math.max(r - (metHist[i] || 0), 0));
  const rewardHist = steps.map((s) => Number(history.reward?.[s] || 0));

  const requested = Math.abs(Number(currentState.load_current || 0));
  const available = Math.max(0, Number(currentState.load_met || 0));
  const metFrac = requested > 0 ? Math.min(available / requested, 1) : 0;
  const maxReq = requestedHist.length ? Math.max(...requestedHist) : 1;

  return (
    <div className="load-status">
      <h3>{module.type === 'building' ? 'Building' : 'House'} {idx}</h3>
      <div className="load-grid">
        <div className="requested-value">
          <div className="value" style={{ color: 'var(--blue)' }}>
            {requested.toFixed(2)} kWh
          </div>
          <div className="label">Requested</div>
        </div>
        <div className="available-value">
          <div className="value" style={{ color: 'var(--green)' }}>
            {available.toFixed(2)} kWh
          </div>
          <div className="label">Available</div>
        </div>
        <div className="soc-graph">
            <SocBar value={metFrac} />
            <div className="label">Load met</div>
        </div>
        <div className="load-graph">
            <div className="label">Load History</div>
            <LoadAreaChart metData={metHist} unmetData={unmetHist} max={maxReq} steps={steps} />
        </div>
        <div className="reward-graph">
            <div className="label">Reward History</div>
            <RewardChart data={rewardHist} steps={steps} />
        </div>
      </div>
    </div>
  );
}

LoadStatus.propTypes = {
  module: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
