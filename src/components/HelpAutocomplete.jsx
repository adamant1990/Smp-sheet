import { useEffect, useMemo, useState } from 'react';
import { getDirectoryData, suggestDirections } from './DirectoryManager';

function normalize(value) { return value.trim().toLowerCase().replace(/ё/g, 'е'); }

export default function HelpAutocomplete({ value, onChange }) {
  const [data, setData] = useState(getDirectoryData);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setData(getDirectoryData());
    window.addEventListener('smp-directories-updated', refresh);
    return () => window.removeEventListener('smp-directories-updated', refresh);
  }, []);

  const text = value || '';
  const parts = text.split(/(\s+)/);
  const current = parts[parts.length - 1] || '';
  const q = normalize(current);
  const routePrefixes = ['внут', 'вмыш', 'подк', 'субл', 'в/в', 'в/м', 'п/к', 'с/л'];
  const isRouteQuery = q.length > 1 && routePrefixes.some(x => x.includes(q) || q.includes(x));

  const results = useMemo(() => {
    if (!q) return [];
    if (isRouteQuery) return suggestDirections(current).slice(0, 6);
    return data.drugs.filter(item => normalize(item.name).includes(q)).slice(0, 6);
  }, [q, current, isRouteQuery, data]);

  const choose = item => {
    const replacement = typeof item === 'string' ? item : [item.name, item.dose].filter(Boolean).join(' ');
    const prefix = parts.slice(0, -1).join('');
    onChange(`${prefix}${replacement} `);
    setOpen(false);
  };

  return <div className="help-autocomplete">
    <textarea
      rows={5}
      name="help"
      value={text}
      onChange={e => { onChange(e.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)}
      onBlur={() => setTimeout(() => setOpen(false), 180)}
      placeholder="Например: Mor... или внут..."
      autoComplete="off"
    />
    {open && results.length > 0 && <div className="quick-results help-results">
      {results.map((item, index) => <button key={typeof item === 'string' ? item : item.id || index} type="button" onMouseDown={e => e.preventDefault()} onClick={() => choose(item)}>
        {typeof item === 'string' ? item : <><strong>{item.name}</strong><span>{item.dose}</span></>}
      </button>)}
    </div>}
  </div>;
}
