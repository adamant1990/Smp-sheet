import { useEffect, useMemo, useRef, useState } from 'react';

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const YEARS = Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => new Date().getFullYear() - i);
const pad = (n) => String(n).padStart(2, '0');

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function parseValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function Wheel({ value, items, onChange, format = (item) => item }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const index = Math.max(0, items.indexOf(value));

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = index * 40;
  }, [index]);

  const handleScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const next = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / 40)));
      ref.current.scrollTo({ top: next * 40, behavior: 'smooth' });
      onChange(items[next]);
    }, 90);
  };

  return <div className="date-wheel-wrap">
    <div className="date-wheel-highlight" />
    <div className="date-wheel" ref={ref} onScroll={handleScroll}>
      <div className="date-wheel-spacer" />
      {items.map((item) => <button type="button" className={item === value ? 'date-wheel-item selected' : 'date-wheel-item'} key={String(item)} onClick={() => onChange(item)}>{format(item)}</button>)}
      <div className="date-wheel-spacer" />
    </div>
  </div>;
}

export default function DateWheelPicker({ value, onChange }) {
  const parsed = parseValue(value);
  const today = new Date();
  const initial = parsed || { year: today.getFullYear() - 30, month: today.getMonth() + 1, day: Math.min(today.getDate(), 28) };
  const [draft, setDraft] = useState(initial);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (parsed) setDraft(parsed);
  }, [value]);

  const days = useMemo(() => Array.from({ length: daysInMonth(draft.year, draft.month) }, (_, i) => i + 1), [draft.year, draft.month]);

  const setPart = (part, next) => {
    setDraft((prev) => {
      const nextDraft = { ...prev, [part]: next };
      nextDraft.day = Math.min(nextDraft.day, daysInMonth(nextDraft.year, nextDraft.month));
      return nextDraft;
    });
  };

  const apply = () => {
    onChange(`${draft.year}-${pad(draft.month)}-${pad(draft.day)}`);
    setOpen(false);
  };

  return <div className="date-picker-field">
    <span>Дата рождения</span>
    <button type="button" className={value ? 'date-display has-value' : 'date-display'} onClick={() => setOpen(true)}>
      {value ? value.split('-').reverse().join('.') : 'Выберите дату'}
    </button>
    {open && <div className="date-picker-overlay" onMouseDown={() => setOpen(false)}>
      <div className="date-picker-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="date-picker-head"><strong>Дата рождения</strong><button type="button" onClick={() => setOpen(false)}>×</button></div>
        <div className="date-wheels">
          <Wheel value={draft.day} items={days} onChange={(v) => setPart('day', v)} format={pad} />
          <Wheel value={draft.month} items={Array.from({ length: 12 }, (_, i) => i + 1)} onChange={(v) => setPart('month', v)} format={(v) => MONTHS[v - 1]} />
          <Wheel value={draft.year} items={YEARS} onChange={(v) => setPart('year', v)} />
        </div>
        <button type="button" className="date-picker-done" onClick={apply}>Готово</button>
      </div>
    </div>}
  </div>;
}
