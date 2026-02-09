
import { ViewerSourceData, PerformanceTrendData, Product, KPIStats } from './types';

export const VIEWER_SOURCE_DATA: ViewerSourceData[] = [
  { name: 'For You feed', value: 37.72, color: '#22d3ee' },
  { name: 'Search', value: 20.41, color: '#38bdf8' },
  { name: 'Promoted Traffic', value: 17.48, color: '#6366f1' },
  { name: 'Live Merge', value: 8.86, color: '#a855f7' },
];

export const PERFORMANCE_DATA: PerformanceTrendData[] = [
  { time: '06:22', viewers: 120, clicks: 45 },
  { time: '07:30', viewers: 180, clicks: 60 },
  { time: '08:45', viewers: 150, clicks: 55 },
  { time: '09:48', viewers: 240, clicks: 80 },
  { time: '11:00', viewers: 210, clicks: 75 },
  { time: '12:15', viewers: 300, clicks: 110 },
  { time: '13:14', viewers: 420, clicks: 150 },
  { time: '14:45', viewers: 380, clicks: 140 },
  { time: '16:40', viewers: 510, clicks: 190 },
  { time: '18:20', viewers: 480, clicks: 175 },
  { time: '20:07', viewers: 620, clicks: 230 },
];

export const PRODUCTS: Product[] = [];

export const INITIAL_KPI_STATS: KPIStats = {
  totalViews: '0',
  viewers: 0,
  itemsSold: '0',
  engagement: {
    view: { value: '0', trend: 0, isPositive: true },
    like: { value: '0', trend: 0, isPositive: true },
    bookmark: { value: '0', trend: 0, isPositive: true },
    comment: { value: '0', trend: 0, isPositive: true },
    shared: { value: '0', trend: 0, isPositive: true }
  },
  gmv: 0
};
