import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, theme } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, LineChartOutlined } from '@ant-design/icons';

import { SizeFormatter } from '@/utils';
import { Sparkline } from '@/components/viz';
import type { Status } from '@/models/status';
import { mean, peak } from './useOverviewHistory';

interface ThroughputCardProps {
  status: Status;
  up: number[];
  down: number[];
  labels: string[];
  isMobile: boolean;
}

const DOWNLOAD_COLOR = '#10b981'; // Emerald green for download traffic

export default function ThroughputCard({
  status,
  up,
  down,
  labels,
  isMobile,
}: ThroughputCardProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const accent = token.colorPrimary;
  const downColor = DOWNLOAD_COLOR;

  const referenceLines = useMemo(
    () => [
      { y: status.netIO.down, color: `${downColor}88`, dash: '2 4' },
      { y: status.netIO.up, color: `${accent}88`, dash: '2 4' },
    ],
    [status.netIO.up, status.netIO.down, accent, downColor],
  );

  return (
    <Card hoverable className="ov-chart-card" styles={{ body: { padding: 0 } }}>
      <div className="ov-wide-head">
        <div>
          <div className="ov-kicker-group">
            <span
              className="ov-card-icon-badge"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              <LineChartOutlined />
            </span>
            <div className="ov-kicker">{t('pages.index.overallSpeed')}</div>
          </div>
          <div className="ov-sub">
            {`${t('pages.index.throughputSub')} · ${t('pages.index.peak')} ${SizeFormatter.speedFormat(peak(down))}`}
          </div>
        </div>

        <div className="ov-speed-badges">
          <div className="ov-speed-pill ov-speed-pill-up">
            <span className="ov-speed-icon-wrapper">
              <ArrowUpOutlined />
            </span>
            <span className="ov-speed-label">{t('pages.index.upload')}</span>
            <span className="ov-speed-val">{SizeFormatter.speedFormat(status.netIO.up)}</span>
          </div>

          <div className="ov-speed-pill ov-speed-pill-down">
            <span className="ov-speed-icon-wrapper">
              <ArrowDownOutlined />
            </span>
            <span className="ov-speed-label">{t('pages.index.download')}</span>
            <span className="ov-speed-val">{SizeFormatter.speedFormat(status.netIO.down)}</span>
          </div>
        </div>
      </div>

      <div className="ov-wide-chart">
        <Sparkline
          data={up}
          data2={down}
          labels={labels}
          height={isMobile ? 140 : 186}
          strokeWidth={1.8}
          fillOpacity={0.16}
          showTooltip
          showLegend={false}
          valueMax={null}
          stroke={accent}
          stroke2={downColor}
          name1={t('pages.index.upload')}
          name2={t('pages.index.download')}
          yFormatter={SizeFormatter.speedFormat}
          referenceLines={referenceLines}
        />
      </div>

      <div className="ov-wide-foot">
        <div className="ov-stat-tile">
          <div className="ov-stat-tile-header">
            <ArrowUpOutlined style={{ color: accent, fontSize: 11 }} />
            <span className="ov-kicker">{t('pages.index.sent')}</span>
          </div>
          <div className="ov-foot-value">{SizeFormatter.sizeFormat(status.netTraffic.sent)}</div>
        </div>

        <div className="ov-stat-tile">
          <div className="ov-stat-tile-header">
            <ArrowDownOutlined style={{ color: downColor, fontSize: 11 }} />
            <span className="ov-kicker">{t('pages.index.received')}</span>
          </div>
          <div className="ov-foot-value">{SizeFormatter.sizeFormat(status.netTraffic.recv)}</div>
        </div>

        <div className="ov-stat-tile">
          <div className="ov-stat-tile-header">
            <span className="ov-kicker">{t('pages.index.avgWindow')}</span>
          </div>
          <div className="ov-foot-value ov-foot-split">
            <span className="ov-foot-part" style={{ color: accent }}>
              {`↑ ${SizeFormatter.speedFormat(mean(up))}`}
            </span>
            <span className="ov-foot-sep-dot">·</span>
            <span className="ov-foot-part" style={{ color: downColor }}>
              {`↓ ${SizeFormatter.speedFormat(mean(down))}`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
