import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Card, theme } from 'antd';

import { Sparkline } from '@/components/viz';
import { mean, peak } from './useOverviewHistory';

interface VitalTileProps {
  icon: ReactNode;
  label: string;
  percent: number;
  statusColor: string;
  detail: string;
  footLeft: string;
  footRight: string;
  data: number[];
  isMobile: boolean;
}

export default function VitalTile({
  icon,
  label,
  percent,
  statusColor,
  detail,
  footLeft,
  footRight,
  data,
  isMobile,
}: VitalTileProps) {
  const { token } = theme.useToken();
  const meanColor = token.colorTextTertiary;

  const referenceLines = useMemo(
    () => (data.length > 1 ? [{ y: mean(data), dash: '3 4', color: meanColor }] : []),
    [data, meanColor],
  );

  // SVG circular progress gauge calculations
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Sane maximum for percentage gauges: always at least 100 so small percentages don't look filled
  const effectiveMax = Math.max(100, Math.ceil(peak(data)));

  return (
    <Card hoverable className="ov-tile" styles={{ body: { padding: 0 } }}>
      <div className="ov-tile-head">
        <div className="ov-tile-badge-group">
          <span
            className="ov-tile-icon-box"
            style={{
              backgroundColor: `${statusColor}18`,
              color: statusColor,
            }}
          >
            {icon}
          </span>
          <span className="ov-kicker">{label}</span>
        </div>

        <div className="ov-tile-gauge" title={`${clampedPercent.toFixed(1)}%`}>
          <svg width="34" height="34" viewBox="0 0 34 34">
            <circle
              className="ov-gauge-bg"
              cx="17"
              cy="17"
              r={radius}
              fill="none"
              strokeWidth="2.75"
            />
            <circle
              className="ov-gauge-bar"
              cx="17"
              cy="17"
              r={radius}
              fill="none"
              strokeWidth="2.75"
              stroke={statusColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 17 17)"
            />
          </svg>
        </div>
      </div>

      <div className="ov-tile-value">
        <span className="ov-tile-number">{percent.toFixed(1)}</span>
        <span className="ov-tile-unit">%</span>
      </div>

      <div className="ov-tile-detail">{detail}</div>

      <div className="ov-tile-foot">
        <span className="ov-tile-chip">{footLeft}</span>
        <span className="ov-tile-chip">{footRight}</span>
      </div>

      <div className="ov-tile-chart">
        <Sparkline
          data={data}
          height={isMobile ? 44 : 54}
          strokeWidth={1.75}
          fillOpacity={0.16}
          showGrid={false}
          showMarker={false}
          valueMin={0}
          valueMax={effectiveMax}
          stroke={statusColor}
          referenceLines={referenceLines}
          yFormatter={(v) => `${v.toFixed(0)}%`}
          name1={label}
        />
      </div>
    </Card>
  );
}
