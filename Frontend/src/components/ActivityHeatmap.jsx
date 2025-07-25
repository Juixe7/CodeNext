import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';

const DAYS = 365;
const WEEKS = Math.ceil(DAYS / 7);

const levelColor = (count, hasAccepted) => {
  if (!count) return 'bg-base-300';
  if (hasAccepted) {
    if (count >= 5) return 'bg-success';
    if (count >= 3) return 'bg-success/70';
    if (count >= 2) return 'bg-success/50';
    return 'bg-success/30';
  }
  // Only wrong/error submissions
  if (count >= 3) return 'bg-warning/60';
  return 'bg-warning/30';
};

const getDateGrid = () => {
  const today = new Date();
  const grid = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    grid.push(d.toISOString().split('T')[0]);
  }
  return grid;
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ActivityHeatmap({ userId }) {
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const url = userId ? `/user/heatmap?userId=${userId}` : '/user/heatmap';
    axiosClient.get(url)
      .then(r => setHeatmap(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const dates = getDateGrid();
  // Pad front so first day aligns to correct weekday
  const firstDow = new Date(dates[0]).getDay(); // 0=Sun
  const paddedDates = [...Array(firstDow).fill(null), ...dates];

  // Build weeks array
  const weeks = [];
  for (let i = 0; i < paddedDates.length; i += 7) {
    weeks.push(paddedDates.slice(i, i + 7));
  }

  // Month labels: for each week, check if 1st of month appears
  const monthLabels = weeks.map((week) => {
    for (const d of week) {
      if (d && new Date(d).getDate() <= 7) {
        return MONTH_LABELS[new Date(d).getMonth()];
      }
    }
    return '';
  });

  const totalSubmissions = Object.values(heatmap).reduce((s, v) => s + v.count, 0);
  const activeDays = Object.keys(heatmap).length;

  if (loading) return (
    <div className="card bg-base-100 border border-base-300 p-5">
      <div className="h-4 w-32 bg-base-300 rounded animate-pulse mb-4" />
      <div className="flex gap-1">
        {Array.from({length: 52}).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            {Array.from({length: 7}).map((_, j) => (
              <div key={j} className="w-3 h-3 rounded-sm bg-base-300 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card bg-base-100 border border-base-300 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Activity</h3>
        <div className="flex items-center gap-3 text-xs text-base-content/50">
          <span>{totalSubmissions} submissions</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-1 mb-1 ml-6">
        {monthLabels.map((label, i) => (
          <div key={i} className="w-3 text-[9px] text-base-content/40 text-center">{label}</div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day of week labels */}
        <div className="flex flex-col gap-1 mr-1 shrink-0">
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} className="w-3 h-3 text-[9px] text-base-content/30 text-center leading-3">{i%2===1?d:''}</div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="w-3 h-3" />;
              const data = heatmap[date];
              const color = levelColor(data?.count, data?.accepted > 0);
              return (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm ${color} cursor-pointer transition-transform hover:scale-125 relative`}
                  onMouseEnter={(e) => setTooltip({ date, data, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-base-content/40">
        <span>Less</span>
        {['bg-base-300','bg-success/30','bg-success/50','bg-success/70','bg-success'].map((c,i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-base-content text-base-100 text-xs px-2 py-1.5 rounded-lg pointer-events-none shadow-lg"
          style={{ top: tooltip.y - 50, left: tooltip.x - 60 }}
        >
          <p className="font-semibold">{tooltip.date}</p>
          {tooltip.data
            ? <p>{tooltip.data.count} submission{tooltip.data.count !== 1 ? 's' : ''} · {tooltip.data.accepted} accepted</p>
            : <p>No activity</p>}
        </div>
      )}
    </div>
  );
}
