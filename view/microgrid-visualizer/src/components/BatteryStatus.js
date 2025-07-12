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

function AreaChart({ data, max }) {
  const ref = useRef(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = 300;
    const height = 180;
    const margin = { top: 20, right: 10, bottom: 20, left: 30 };

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
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));
  }, [data, max]);

  return <svg ref={ref}></svg>;
}

function RewardChart({ data }) {
  const ref = useRef(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = 300;
    const height = 180;
    const margin = { top: 20, right: 10, bottom: 20, left: 30 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const x = d3
      .scaleBand()
      .domain(data.map((_, i) => i))
      .range([margin.left, width - margin.right])
      .padding(0.1);
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
      .attr('width', x.bandwidth())
      .attr('fill', (d) => (d >= 0 ? '#74971a' : '#ec3137'));

    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));
  }, [data]);

  return <svg ref={ref}></svg>;
}

export default function BatteryStatus({ module, history, currentState }) {
  const idx = module.backendId ? parseInt(module.backendId.split('_')[1], 10) + 1 : 1;
  const maxCap = module.params?.max_capacity || 1;
  const chargeHist = Object.entries(history.current_charge || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, v]) => Number(v));
  const rewardHist = Object.entries(history.reward || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, v]) => Number(v));

  const stepKeys = [
    ...Object.keys(history.charge_amount || {}),
    ...Object.keys(history.discharge_amount || {}),
  ].map(Number);
  const lastStep = stepKeys.length ? Math.max(...stepKeys) : null;
  const chargeAmt = lastStep !== null ? Number(history.charge_amount?.[lastStep] || 0) : 0;
  const dischargeAmt = lastStep !== null ? Number(history.discharge_amount?.[lastStep] || 0) : 0;
  let variation = 0;
  let variationColor = '#444';
  if (chargeAmt > 0) {
    variation = chargeAmt;
    variationColor = 'var(--green)';
  } else if (dischargeAmt > 0) {
    variation = -dischargeAmt;
    variationColor = 'var(--red)';
  }

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
            <SocBar value={Number(currentState.soc || 0)} />
            <div className="label">SoC</div>     
        </div>
        <div className="charge-graph">
            <div className="label">Charge History</div>     
            <AreaChart data={chargeHist} max={maxCap} />
        </div>
        <div className="reward-graph">
            <div className="label">Reward History</div>     
            <RewardChart data={rewardHist} />
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
