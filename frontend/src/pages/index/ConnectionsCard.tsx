import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, theme } from 'antd';
import { ApiOutlined } from '@ant-design/icons';

import { Sparkline } from '@/components/viz';
import type { Status } from '@/models/status';

interface ConnectionsCardProps {
  status: Status;
  tcp: number[];
  udp: number[];
  labels: string[];
  isMobile: boolean;
}

const UDP_COLOR = '#8b5cf6'; // Clean modern purple/violet for UDP

export default function ConnectionsCard({
  status,
  tcp,
  udp,
  labels,
  isMobile,
}: ConnectionsCardProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const accent = token.colorPrimary;
  const udpColor = UDP_COLOR;

  const total = status.tcpCount + status.udpCount;
  const tcpPercent = total > 0 ? Math.round((status.tcpCount / total) * 100) : 50;
  const udpPercent = 100 - tcpPercent;

  const referenceLines = useMemo(
    () => [
      { y: status.udpCount, color: `${udpColor}88`, dash: '2 4' },
      { y: status.tcpCount, color: `${accent}88`, dash: '2 4' },
    ],
    [status.tcpCount, status.udpCount, accent, udpColor],
  );

  return (
    <Card hoverable className="ov-chart-card" styles={{ body: { padding: 0 } }}>
      <div className="ov-wide-head ov-wide-head-stack">
        <div className="ov-kicker-group">
          <span
            className="ov-card-icon-badge"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            <ApiOutlined />
          </span>
          <div className="ov-kicker">{t('pages.index.connectionCount')}</div>
        </div>

        <div className="ov-conn-total">
          <span className="ov-tile-number">{total}</span>
          <span className="ov-tile-unit">{t('pages.index.openSockets')}</span>
        </div>
      </div>

      <div className="ov-conn-legend">
        <div className="ov-conn-pill">
          <span className="ov-swatch-dot" style={{ backgroundColor: accent }} />
          <span className="ov-conn-proto">TCP</span>
          <span className="ov-legend-num">{status.tcpCount.toLocaleString()}</span>
        </div>
        <div className="ov-conn-pill">
          <span className="ov-swatch-dot" style={{ backgroundColor: udpColor }} />
          <span className="ov-conn-proto">UDP</span>
          <span className="ov-legend-num">{status.udpCount.toLocaleString()}</span>
        </div>
      </div>

      <div className="ov-wide-chart">
        <Sparkline
          data={tcp}
          data2={udp}
          labels={labels}
          height={isMobile ? 140 : 186}
          strokeWidth={1.8}
          fillOpacity={0.16}
          showTooltip
          showLegend={false}
          valueMax={null}
          stroke={accent}
          stroke2={udpColor}
          name1="TCP"
          name2="UDP"
          yFormatter={(v) => Math.round(v).toLocaleString()}
          referenceLines={referenceLines}
        />
      </div>

      <div className="ov-wide-foot">
        <div className="ov-conn-split-bar-container">
          <div className="ov-conn-split-labels">
            <span>{`TCP ${tcpPercent}%`}</span>
            <span>{`UDP ${udpPercent}%`}</span>
          </div>
          <div className="ov-conn-split-bar">
            <div
              className="ov-conn-bar-tcp"
              style={{ width: `${tcpPercent}%`, backgroundColor: accent }}
            />
            <div
              className="ov-conn-bar-udp"
              style={{ width: `${udpPercent}%`, backgroundColor: udpColor }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
