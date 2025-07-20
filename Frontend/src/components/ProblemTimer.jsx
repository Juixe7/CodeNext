import { useState, useEffect, useRef } from 'react';
import { Timer, Square } from 'lucide-react';

export default function ProblemTimer() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const interval = useRef(null);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(interval.current);
    }
    return () => clearInterval(interval.current);
  }, [running]);

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const color = seconds > 2700 ? 'text-error' : seconds > 1200 ? 'text-warning' : 'text-base-content/70';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-mono text-sm font-semibold tabular-nums ${color}`}>{fmt(seconds)}</span>
      <button
        onClick={() => { if (running) { setRunning(false); setSeconds(0); } else setRunning(true); }}
        className={`btn btn-xs gap-1 ${running ? 'btn-error btn-outline' : 'btn-ghost'}`}
        title={running ? 'Stop timer' : 'Start timer'}
      >
        {running ? <><Square className="w-3 h-3" /> Stop</> : <><Timer className="w-3 h-3" /> Start</>}
      </button>
    </div>
  );
}
