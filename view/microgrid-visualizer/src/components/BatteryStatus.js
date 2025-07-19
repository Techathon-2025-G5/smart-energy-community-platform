import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import './BatteryStatus.css';
import './StatusCommon.css';
function SocBar({ value }) {
  return (
    <div className="soc-bar">
      <div className="soc-fill" style={{ height: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

function AreaChart({ data, max, steps }) {
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
    const y = d3
      .scaleLinear()
      .domain([0, max || d3.max(data) || 1])
      .range([height - margin.bottom, margin.top]);

  const area = d3
    .area()
    .x((d, i) => x(i))
    .y0(y(0))
    .y1((d) => y(d));

  svg.append('path').datum(data).attr('fill', '#74971a').attr('d', area);
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
  }, [data, max, steps]);

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

    const domainMax = Math.max(data.length, 5);
    const x = d3
      .scaleLinear()
      .domain([0, domainMax])
      .range([margin.left, width - margin.right]);
    const barWidth = (width - margin.left - margin.right) / domainMax;
    const gap = data.length > 72 ? 0 : 1;
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
      .attr('x', (_, i) => x(i))
      .attr('y', (d) => (d >= 0 ? y(d) : y(0)))
      .attr('height', (d) => Math.abs(y(d) - y(0)))
      .attr('width', barWidth - gap)
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
          .tickValues(tickIndices.map((i) => i + 0.5))
          .tickFormat((d) => (steps ? Math.floor(steps[Math.floor(d)] / 24) + 1 : Math.floor(d)))
      );
  }, [data, steps]);

  return <svg ref={ref}></svg>;
}

export default function BatteryStatus({ module, history, currentState }) {
  const idx = module.backendId
    ? parseInt(module.backendId.split('_')[1], 10) + 1
    : module.idx || 1;
  const maxCap = module.params?.max_capacity || 1;
  const efficiency = Number(module.params?.efficiency ?? 1);
  const stepSet = new Set([
    ...Object.keys(history.current_charge || {}),
    ...Object.keys(history.reward || {}),
  ]);
  const steps = Array.from(stepSet)
    .map(Number)
    .sort((a, b) => a - b);
  const chargeHist = steps.map((s) => Number(history.current_charge?.[s] || 0));
  const rewardHist = steps.map((s) => Number(history.reward?.[s] || 0));

  const stepKeys = [
    ...Object.keys(history.charge_amount || {}),
    ...Object.keys(history.discharge_amount || {}),
  ].map(Number);
  const lastStep = stepKeys.length ? Math.max(...stepKeys) : null;
  const chargeAmt =
    lastStep !== null ? Number(history.charge_amount?.[lastStep] || 0) : 0;
  const dischargeAmt =
    lastStep !== null ? Number(history.discharge_amount?.[lastStep] || 0) : 0;


  let variation = 0;
  const chargeNow = Number(currentState.charge_amount ?? 0);
  const dischargeNow = Number(currentState.discharge_amount ?? 0);
  if (chargeNow > 0) {
    variation = chargeNow;
  } else if (dischargeNow > 0) {
    variation = -dischargeNow;
  } else if (chargeAmt > 0) {
    variation = chargeAmt;
  } else if (dischargeAmt > 0) {
    variation = -dischargeAmt;
  }

  let variationColor = '#444';
  if (variation > 0) {
    variationColor = 'var(--green)';
  } else if (variation < 0) {
    variationColor = 'var(--red)';
  }

  const socValue = Number(currentState.soc || 0);

  return (
    <div className="battery-status">
      <h3>Battery {idx}</h3>
      <div className="battery-grid">
        <div className="charge-value">
          <div className="value" style={{ color: 'var(--blue)' }}>
            {Number(currentState.current_charge || 0).toFixed(2)} kWh
          </div>
          <div className="label">Current Charge</div>
        </div>
        <div className="variation-value">
          <div className="value" style={{ color: variationColor }}>
            {variation.toFixed(2)} kWh
          </div>
          <div className="label">Variation</div>
        </div>
        <div className="soc-graph">
          <SocBar value={socValue} />
          <div className="label">SoC</div>
        </div>
        <div className="charge-graph">
            <div className="label">Charge History</div>     
            <AreaChart data={chargeHist} max={maxCap} steps={steps} />
        </div>
        <div className="reward-graph">
            <div className="label">Reward History</div>     
            <RewardChart data={rewardHist} steps={steps} />
        </div>
      </div>
    </div>
  );
}

BatteryStatus.propTypes = {
  module: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
