import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Card, ConfigProvider, Layout, Tabs, message } from 'antd';
import type { TabsProps } from 'antd';
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  LinkOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

import { ClipboardManager, LanguageManager } from '@/utils';
import { setMessageInstance } from '@/utils/messageBus';
import { useTheme } from '@/hooks/useTheme';
import SubAppsTab from './SubAppsTab';
import SubConfigsTab from './SubConfigsTab';
import SubHeader from './SubHeader';
import SubHero from './SubHero';
import SubLinksTab from './SubLinksTab';
import { buildSubApps, daysUntil, detectPlatform, resolveSubStatus } from './subPageModel';
import './SubPage.css';

const DEV_MOCK_SUB_DATA = {
  sId: 'vip-client-771',
  enabled: true,
  subUrl: 'https://v2ray.my-server.net/sub/c9f28a8d-e069-4560-8488-828556bc3aa8',
  subJsonUrl: 'https://v2ray.my-server.net/sub/c9f28a8d-e069-4560-8488-828556bc3aa8/json',
  subClashUrl: 'https://v2ray.my-server.net/sub/c9f28a8d-e069-4560-8488-828556bc3aa8/clash',
  subTitle: 'Premium Ultra Mesh (Node Group A)',
  subSupportUrl: 'https://t.me/heshan_support',
  subUpdates: 12,
  announce:
    '🚀 Global high-speed mesh nodes upgraded with low-latency routes to Tokyo, Singapore, and Frankfurt.',
  links: [
    'vless://b6c16709-3aa9-4f7d-bb62-678c1825c04c@jp1.node.domain:443?type=tcp&security=reality&pbk=xyz&fp=chrome&sni=gateway.icloud.com&sid=abc#Tokyo-Ultra-01',
    'vless://b6c16709-3aa9-4f7d-bb62-678c1825c04c@sg1.node.domain:443?type=grpc&security=reality&serviceName=grpc-sub&fp=chrome&sni=gateway.icloud.com#Singapore-Direct-02',
    'vmess://eyJ2IjoiMiIsInBzIjoiRlJLLUZyYW5rZnVydC0wMyIsImFkZCI6ImRlMS5ub2RlLmRvbWFpbiIsInBvcnQiOiI0NDMiLCJpZCI6ImI2YzE2NzA5LTNhYTktNGY3ZC1iYjYyLTY3OGMxODI1YzA0YyIsImFpZCI6IjAiLCJzY3kiOiJhdXRvIiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiJkZTEubm9kZS5kb21haW4iLCJwYXRoIjoiL3ZtZXNzIiwidGxzIjoidGxzIn0=',
    'trojan://pass12345@us1.node.domain:443?security=tls&headerType=none&type=tcp&sni=us1.node.domain#US-West-LosAngeles-04',
  ],
  emails: ['subscriber@heshan.org'],
  totalByte: 107374182400, // 100 GB
  downloadByte: 28991029248, // ~27 GB
  uploadByte: 7730941132, // ~7.2 GB
  usedByte: 36721970380, // ~34.2 GB
  expire: Math.floor((Date.now() + 18 * 86400 * 1000) / 1000), // 18 days left
  lastOnline: Date.now() - 14 * 60 * 1000,
  download: '27.00 GB',
  upload: '7.20 GB',
  used: '34.20 GB',
  total: '100.00 GB',
  remained: '65.80 GB',
  datepicker: 'gregorian' as const,
};

const rawData = window.__SUB_PAGE_DATA__;
const subData =
  rawData && Object.keys(rawData).length > 0
    ? rawData
    : import.meta.env.DEV
      ? DEV_MOCK_SUB_DATA
      : {};

const sId = subData.sId || '';
const subUrl = subData.subUrl || '';
const subJsonUrl = subData.subJsonUrl || '';
const subClashUrl = subData.subClashUrl || '';
const subTitle = subData.subTitle || '';
const subSupportUrl = subData.subSupportUrl || '';
const updateHours = Number(subData.subUpdates || 0);
const announce = subData.announce || '';
const links: string[] = Array.isArray(subData.links) ? subData.links : [];
const linkEmails: string[] = Array.isArray(subData.emails) ? subData.emails : [];
const totalByte = Number(subData.totalByte || 0);
const usedByte =
  Number(subData.usedByte || 0) ||
  Number(subData.downloadByte || 0) + Number(subData.uploadByte || 0);
const expireMs = Number(subData.expire || 0) * 1000;
const clientEmail = [...new Set(linkEmails.filter(Boolean))].join(', ');
const loadedAt = Date.now();

const heroData = {
  status: resolveSubStatus({ enabled: !!subData.enabled, usedByte, totalByte, expireMs }, loadedAt),
  daysLeft: daysUntil(expireMs, loadedAt),
  usedByte,
  totalByte,
  expireMs,
  lastOnlineMs: Number(subData.lastOnline || 0),
  download: subData.download || '0',
  upload: subData.upload || '0',
  used: subData.used || '0',
  total: subData.total || '∞',
  remained: subData.remained || '',
  datepicker: subData.datepicker || 'gregorian',
};

const apps = buildSubApps({ subUrl, sId, subTitle });
const initialPlatform = detectPlatform(navigator.userAgent);
const RTL_LANGUAGES = new Set(['fa-IR', 'ar-EG']);

export default function SubPage() {
  const { t } = useTranslation();
  const { isDark, isUltra, antdThemeConfig } = useTheme();
  const [messageApi, messageContextHolder] = message.useMessage();
  useEffect(() => {
    setMessageInstance(messageApi);
  }, [messageApi]);
  const [lang, setLang] = useState<string>(() => LanguageManager.getLanguage('subscription'));

  const onLangChange = useCallback((next: string) => {
    setLang(next);
    LanguageManager.setLanguage(next, 'subscription');
  }, []);

  const copy = useCallback(
    async (value: string, toast?: string) => {
      if (!value) return;
      const ok = await ClipboardManager.copyText(value);
      if (ok) messageApi.success(toast ?? t('copied'));
    },
    [t, messageApi],
  );

  const open = useCallback((url: string) => {
    if (url) window.open(url, '_blank');
  }, []);

  const tabs = useMemo(() => {
    const items: NonNullable<TabsProps['items']> = [];
    if (subUrl || subJsonUrl || subClashUrl) {
      items.push({
        key: 'subscription',
        icon: <LinkOutlined />,
        label: t('subscription.tabLinks'),
        children: (
          <SubLinksTab
            subUrl={subUrl}
            subJsonUrl={subJsonUrl}
            subClashUrl={subClashUrl}
            onCopy={copy}
          />
        ),
      });
    }
    if (subUrl) {
      items.push({
        key: 'apps',
        icon: <AppstoreOutlined />,
        label: t('subscription.tabApps'),
        children: <SubAppsTab apps={apps} initialPlatform={initialPlatform} onOpen={open} />,
      });
    }
    if (links.length > 0) {
      items.push({
        key: 'configs',
        icon: <UnorderedListOutlined />,
        label: (
          <>
            {t('subscription.tabConfigs')}
            <span className="sub-tab-count">{links.length}</span>
          </>
        ),
        children: <SubConfigsTab links={links} onCopy={copy} />,
      });
    }
    return items;
  }, [t, copy, open]);

  const direction = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
  const pageClass = ['subscription-page', isDark && 'is-dark', isUltra && 'is-ultra']
    .filter(Boolean)
    .join(' ');

  return (
    <ConfigProvider theme={antdThemeConfig} direction={direction}>
      {messageContextHolder}
      <Layout className={pageClass} dir={direction}>
        <Layout.Content className="sub-content">
          <Card className="sub-card">
            <SubHeader
              title={subTitle}
              sId={sId}
              email={clientEmail}
              lang={lang}
              onLangChange={onLangChange}
            />
            {announce && <Alert type="info" showIcon title={announce} className="sub-announce" />}
            <SubHero {...heroData} lang={lang} />
            {tabs.length > 0 && <Tabs className="sub-tabs" tabBarGutter={24} items={tabs} />}
            {(updateHours > 0 || subSupportUrl) && (
              <footer className="sub-footer">
                {updateHours > 0 && (
                  <span>
                    <ClockCircleOutlined />
                    {t('subscription.updateInterval', { hours: updateHours })}
                  </span>
                )}
                {subSupportUrl && (
                  <a href={subSupportUrl} target="_blank" rel="noopener noreferrer">
                    <CustomerServiceOutlined />
                    {t('subscription.support')}
                  </a>
                )}
              </footer>
            )}
          </Card>
        </Layout.Content>
      </Layout>
    </ConfigProvider>
  );
}
