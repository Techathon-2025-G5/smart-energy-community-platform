import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import api from '../api/client';
import { parseTotalsLog, parseTotalsTotals } from '../utils/totals';
import './MicrogridStatus.css';
import './StatusCommon.css';

function CoverChart({ data, steps }) {
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

    const y = d3.scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top]);

    const stack = d3
      .stack()
      .keys(['renewables', 'batteries', 'grid', 'unmet'])
      .offset(d3.stackOffsetExpand);

    const series = stack(data);

    const area = d3
      .area()
      .x((_, i) => x(i))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    const colors = {
      renewables: 'var(--green)',
      batteries: 'var(--blue)',
      grid: '#d2b32c',
      unmet: 'var(--red)',
    };

    svg
      .selectAll('path')
      .data(series)
      .enter()
      .append('path')
      .attr('fill', (d) => colors[d.key])
      .attr('d', area);

    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5, '%'));

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
      .call(d3.axisBottom(x).tickValues(tickIndices).tickFormat((d) => (steps ? Math.floor(steps[d] / 24) + 1 : d)));
  }, [data, steps]);

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
      .domain([Math.min(0, d3.min(data) || 0), Math.max(0, d3.max(data) || 1)])
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
          .tickValues(tickIndices.map((i) => i + 0.5))
          .tickFormat((d) => (steps ? Math.floor(steps[Math.floor(d)] / 24) + 1 : Math.floor(d)))
      );
  }, [data, steps]);

  return <svg ref={ref}></svg>;
}

export default function MicrogridStatus({ step }) {
  const [totals, setTotals] = useState({
    exported: 0,
    imported: 0,
    balance: 0,
    load_unmet: 0,
    renewable_unused: 0,
    reward: 0,
  });
  const [coverData, setCoverData] = useState([]);
  const [rewardHist, setRewardHist] = useState([]);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const log = await api.getLog();
        const totalsResp = await api.getTotals();
        const parsedSteps = parseTotalsLog(log);
        const parsedTotals = parseTotalsTotals(totalsResp);
        const stepList = Object.keys(parsedSteps.renewable?.renewable_used || {})
          .map(Number)
          .sort((a, b) => a - b);
        setSteps(stepList);
        const last = stepList[stepList.length - 1];

        const cover = stepList.map((s) => ({
          renewables: Number(parsedSteps.renewable?.renewable_used?.[s] || 0),
          batteries: Number(parsedSteps.battery?.discharge_amount?.[s] || 0),
          grid: Number(parsedSteps.grid?.grid_import?.[s] || 0),
          unmet: Math.max(
            0,
            - Number(parsedSteps.load?.load_current?.[s] || 0) -
              Number(parsedSteps.load?.load_met?.[s] || 0)
          ),
        }));
        setCoverData(cover);
        setRewardHist(stepList.map((s) => Number(parsedSteps.balance?.reward?.[s] || 0)));

        setTotals({
          exported: Number(parsedTotals.grid?.grid_export || 0),
          imported: Number(parsedTotals.grid?.grid_import || 0),
          balance:
            Number(parsedTotals.grid?.grid_balance || 0) -
            Number(parsedTotals.battery?.cycle_cost || 0),
          load_unmet: Number(parsedTotals.load?.load_met || 0),
          renewable_unused: Number(parsedTotals.renewable?.curtailment || 0),
          reward: Number(parsedTotals.balance?.reward || 0),
        });
      } catch (_) {
        // ignore
      }
    };
    fetchData();
  }, [step]);

  const balanceColor = totals.balance >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div className="microgrid-status">

      <div className="totals-section">
        <h3>Totals</h3>
        <div className="totals-grid">
          <div className="exported-value">
            <div className="value" style={{ color: 'var(--green)' }}>
              {(totals.exported >= 1000 ? (totals.exported / 1000).toFixed(2) : totals.exported.toFixed(2))}{' '}
              {totals.exported >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Total exported</div>
          </div>
          <div className="load-unmet-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(totals.load_unmet >= 1000 ? (totals.load_unmet / 1000).toFixed(2) : totals.load_unmet.toFixed(2))}{' '}
              {totals.load_unmet >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Load unmet</div>
          </div>
          <div className="imported-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(totals.imported >= 1000 ? (totals.imported / 1000).toFixed(2) : totals.imported.toFixed(2))}{' '}
              {totals.imported >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Total imported</div>
          </div>
          <div className="renewable-unused-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(totals.renewable_unused >= 1000 ? (totals.renewable_unused / 1000).toFixed(2) : totals.renewable_unused.toFixed(2))}{' '}
              {totals.renewable_unused >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Renewable unused</div>
          </div>
          <div className="balance-value">
            <div className="value" style={{ color: balanceColor }}>
              {totals.balance.toFixed(2)}€
            </div>
            <div className="label">Total balance</div>
          </div>
          <div className="reward-value">
            <div className="value" style={{ color: totals.reward >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(-totals.reward >= 1000 ? (totals.reward / 1000).toFixed(2) : totals.reward.toFixed(2))}{' '}
              {-totals.reward >= 1000 ? 'k' : ''}
            </div>
            <div className="label">Total reward</div>
          </div>
        </div>
      </div>

      <div className="graphs-section">
        <div className="graphs-grid">
          <div className="cover-graph">
            <div className="label">Energy balance history</div>
            <div className="cover-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--green)' }} />
                Renewable
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--blue)' }} />
                Batteries
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--yellow)' }} />
                Grid
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--red)' }} />
                Unmet
              </span>
            </div>
            <CoverChart data={coverData} steps={steps} />
          </div>
          <div className="reward-graph">
            <div className="label">Reward history</div>
            <RewardChart data={rewardHist} steps={steps} />
          </div>
        </div>
      </div>
    </div>
  );
}

MicrogridStatus.propTypes = {
  step: PropTypes.number.isRequired,
};
