import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Tooltip } from 'antd';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DatabaseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

import { ClipboardManager, SizeFormatter, TimeFormatter } from '@/utils';
import { activateOnKey } from '@/utils/a11y';
import type { Status } from '@/models/status';

interface SystemStripProps {
  status: Status;
  showIp: boolean;
  onToggleIp: () => void;
}

export default function SystemStrip({ status, showIp, onToggleIp }: SystemStripProps) {
  const { t } = useTranslation();
  const [copiedV4, setCopiedV4] = useState(false);
  const [copiedV6, setCopiedV6] = useState(false);

  const copyIp = async (ip: string, isV6: boolean) => {
    if (!ip) return;
    const ok = await ClipboardManager.copyText(ip);
    if (ok) {
      if (isV6) {
        setCopiedV6(true);
        setTimeout(() => setCopiedV6(false), 2000);
      } else {
        setCopiedV4(true);
        setTimeout(() => setCopiedV4(false), 2000);
      }
    }
  };

  return (
    <Card hoverable className="ov-strip-card" styles={{ body: { padding: 0 } }}>
      <div className="ov-strip-grid">
        {/* Cell 1: Uptime */}
        <div className="ov-strip-cell">
          <div className="ov-strip-cell-header">
            <span className="ov-strip-icon-badge">
              <ClockCircleOutlined />
            </span>
            <span className="ov-kicker">{t('pages.index.uptime')}</span>
          </div>

          <div className="ov-strip-items">
            <div className="ov-strip-mini-tile">
              <span className="ov-strip-sub">Xray Service</span>
              <span className="ov-strip-value">
                {TimeFormatter.formatSecond(status.appStats.uptime)}
              </span>
            </div>
            <div className="ov-strip-mini-tile">
              <span className="ov-strip-sub">Host OS</span>
              <span className="ov-strip-value">{TimeFormatter.formatSecond(status.uptime)}</span>
            </div>
          </div>
        </div>

        {/* Cell 2: Panel Process */}
        <div className="ov-strip-cell">
          <div className="ov-strip-cell-header">
            <span className="ov-strip-icon-badge">
              <DatabaseOutlined />
            </span>
            <span className="ov-kicker">{t('pages.index.panel')}</span>
          </div>

          <div className="ov-strip-items">
            <div className="ov-strip-mini-tile">
              <span className="ov-strip-sub">{t('pages.index.memory')}</span>
              <span className="ov-strip-value">
                {SizeFormatter.sizeFormat(status.appStats.mem)}
              </span>
            </div>
            <div className="ov-strip-mini-tile">
              <span className="ov-strip-sub">{t('pages.index.threads')}</span>
              <span className="ov-strip-value">{status.appStats.threads}</span>
            </div>
          </div>
        </div>

        {/* Cell 3: Public IP */}
        <div className="ov-strip-cell">
          <div className="ov-strip-cell-header">
            <span className="ov-strip-icon-badge">
              <GlobalOutlined />
            </span>
            <span className="ov-kicker">{t('pages.index.ipAddresses')}</span>
            <Tooltip title={t('pages.index.toggleIpVisibility')}>
              <button
                type="button"
                className="ov-ip-toggle-btn"
                aria-label={t('pages.index.toggleIpVisibility')}
                onClick={onToggleIp}
                onKeyDown={activateOnKey(onToggleIp)}
              >
                {showIp ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>
            </Tooltip>
          </div>

          <div className={`ov-ip-container${showIp ? '' : ' ip-hidden'}`}>
            <div className="ov-ip-row">
              <span className="ov-ip-pill-label">IPv4</span>
              <span className="ov-mono ov-ip-text">{status.publicIP.ipv4 || '—'}</span>
              {showIp && status.publicIP.ipv4 && (
                <Tooltip title={copiedV4 ? t('copied') : t('copy')}>
                  <button
                    type="button"
                    className="ov-ip-copy-btn"
                    onClick={() => copyIp(String(status.publicIP.ipv4), false)}
                    aria-label={t('copy')}
                  >
                    {copiedV4 ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
                  </button>
                </Tooltip>
              )}
            </div>

            {status.publicIP.ipv6 && status.publicIP.ipv6 !== '—' && (
              <div className="ov-ip-row ov-ip-row-v6">
                <span className="ov-ip-pill-label">IPv6</span>
                <span className="ov-mono ov-ip-text ov-ip-v6">{status.publicIP.ipv6}</span>
                {showIp && (
                  <Tooltip title={copiedV6 ? t('copied') : t('copy')}>
                    <button
                      type="button"
                      className="ov-ip-copy-btn"
                      onClick={() => copyIp(String(status.publicIP.ipv6), true)}
                      aria-label={t('copy')}
                    >
                      {copiedV6 ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
                    </button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
