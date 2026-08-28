import PageContainer from '@/components/layout/page-container';
import { DashboardHome } from '@/features/overview/components/dashboard-home';
import React from 'react';

export default function OverViewLayout({
  sales: _sales,
  pie_stats: _pieStats,
  bar_stats: _barStats,
  area_stats: _areaStats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <DashboardHome />
    </PageContainer>
  );
}
