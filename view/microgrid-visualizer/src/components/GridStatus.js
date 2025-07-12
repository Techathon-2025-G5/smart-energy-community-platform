import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import './GridStatus.css';
import './StatusCommon.css';

function NetAreaChart({ data, steps }) {
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
      .domain([
        Math.min(0, d3.min(data) || 0),
        Math.max(0, d3.max(data) || 1),
      ])
      .range([height - margin.bottom, margin.top]);

    const areaPos = d3
      .area()
      .x((_, i) => x(i))
      .y0(y(0))
      .y1((d) => y(Math.max(0, d)));

    const areaNeg = d3
      .area()
      .x((_, i) => x(i))
      .y0(y(0))
      .y1((d) => y(Math.min(0, d)));

    svg.append('path').datum(data).attr('fill', 'var(--green)').attr('d', areaPos);
    svg.append('path').datum(data).attr('fill', 'var(--red)').attr('d', areaNeg);
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

function LineChart({ importData, exportData, co2Data, steps }) {
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
      .domain([0, Math.max(importData.length - 1, 5)])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max([
          d3.max(importData) || 0,
          d3.max(exportData) || 0,
          d3.max(co2Data) || 0,
        ]) || 1,
      ])
      .range([height - margin.bottom, margin.top]);

    const lineImport = d3
      .line()
      .x((_, i) => x(i))
      .y((d) => y(d));

    svg
      .append('path')
      .datum(importData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--red)')
      .attr('d', lineImport);

    svg
      .append('path')
      .datum(exportData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--green)')
      .attr('d', lineImport);

    svg
      .append('path')
      .datum(co2Data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--blue)')
      .attr('d', lineImport);

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
  }, [importData, exportData, co2Data, steps]);

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
      .attr('fill', (d) => (d >= 0 ? 'var(--green)' : 'var(--red)'));

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

export default function GridStatus({ history, currentState }) {
  const stepSet = new Set([
    ...Object.keys(history.grid_import || {}),
    ...Object.keys(history.grid_export || {}),
    ...Object.keys(history.import_price_current || {}),
    ...Object.keys(history.export_price_current || {}),
    ...Object.keys(history.co2_per_kwh_current || {}),
    ...Object.keys(history.reward || {}),
  ]);
  const steps = Array.from(stepSet)
    .map(Number)
    .sort((a, b) => a - b);

  const importHist = steps.map((s) => Number(history.grid_import?.[s] || 0));
  const exportHist = steps.map((s) => Number(history.grid_export?.[s] || 0));
  const netHist = exportHist.map((e, i) => e - importHist[i]);
  const importPriceHist = steps.map((s) => Number(history.import_price_current?.[s] || 0));
  const exportPriceHist = steps.map((s) => Number(history.export_price_current?.[s] || 0));
  const co2Hist = steps.map((s) => Number(history.co2_per_kwh_current?.[s] || 0));
  const rewardHist = steps.map((s) => Number(history.reward?.[s] || 0));

  const gridImport = Number(currentState.grid_import || 0);
  const gridExport = Number(currentState.grid_export || 0);
  const importPrice = Number(currentState.import_price_current || 0);

  let energy = 0;
  let energyLabel = 'Import';
  let energyColor = 'var(--disabled)';

  let money = 0;
  let moneyLabel = 'Spent';
  let moneyColor = 'var(--disabled)';

  if (gridImport > 0) {
    energy = gridImport;
    energyColor = 'var(--red)';
    money = -gridImport * importPrice;
    moneyColor = 'var(--red)';
  } else if (gridExport > 0) {
    energy = gridExport;
    energyLabel = 'Export';
    energyColor = 'var(--green)';
    money = gridExport * importPrice;
    moneyLabel = 'Earn';
    moneyColor = 'var(--green)';
  }

  return (
    <div className="grid-status">
      <h3>Grid</h3>
      <div className="grid-grid">
        <div className="energy-value">
          <div className="value" style={{ color: energyColor }}>{energy.toFixed(2)} kWh</div>
          <div className="label">{energyLabel}</div>
        </div>
        <div className="money-value">
          <div className="value" style={{ color: moneyColor }}>{money.toFixed(2)}</div>
          <div className="label">{moneyLabel}</div>
        </div>
        <div className="net-graph">
          <div className="label">Import/Export</div>
          <NetAreaChart data={netHist} steps={steps} />
        </div>
        <div className="price-graph">
          <div className="label">Prices &amp; CO2</div>
          <LineChart
            importData={importPriceHist}
            exportData={exportPriceHist}
            co2Data={co2Hist}
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

GridStatus.propTypes = {
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
