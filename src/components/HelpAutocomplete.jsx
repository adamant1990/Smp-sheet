import { useEffect, useMemo, useState } from 'react';
import { getDirectoryData, suggestDirections } from './DirectoryManager';

const norm = value => String(value || '').toLowerCase().replace(/ё/g, 'е').trim();

export default function HelpAutocomplete({ value, onChange }) {
  const [data, setData] = useState(getDirectoryData);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const refresh = () => setData(getDirectoryData());
    window.addEventListener('smp-directories-updated', refresh);
    return () => window.removeEventListener('smp-directories-updated', refresh);
  }, []);

  const text = String(value || '');
  const currentToken = useMemo(() => {
    const match = text.match(/(^|[\s,;])([^\s,;]*)$/);
    return match ? match[2] : '';
  }, [text]);
  const query = norm(currentToken);
  const directions = useMemo(() => suggestDirections(currentToken), [currentToken]);
  const drugs = useMemo(() => {
    if (!query || directions.length) return [];
    return data.drugs.filter(item => {
      const name = norm(item.name);
      const dose = norm(item.dose);
      return name.startsWith(query) || name.includes(query) || dose.includes(query);
    }).slice(0, 8);
  }, [data, query, directions.length]);
  const results = directions.length
    ? directions.map(label => ({ type: 'route', label }))
    : drugs.map(item => ({ type: 'drug', ...item, label: [item.name, item.dose].filter(Boolean).join(' — ') }));

  const replaceCurrentToken = replacement => {
    const match = text.match(/(^|[\s,;])([^\s,;]*)$/);
    if (!match) return `${text}${replacement}`;
    return `${text.slice(0, text.length - match[2].length)}${replacement}`;
  };

  const choose = item => {
    const replacement = item.type === 'route'
      ? `${item.label} `
      : `${item.name}${item.dose ? ` — ${item.dose}` : ''} `;
    onChange(replaceCurrentToken(replacement));
    setOpen(false);
    setActive(0);
  };

  const handleKeyDown = event => {
    if (!open || !results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (event.key === 'Enter' && results[active]) { event.preventDefault(); choose(results[active]); }
    else if (event.key === 'Escape') setOpen(false);
  };

  return <div className="help-autocomplete">
    <textarea
      rows={6}
      name="help"
      value={text}
      onChange={event => { onChange(event.target.value); setOpen(true); setActive(0); }}
      onFocus={() => setOpen(true)}
      onKeyDown={handleKeyDown}
      onBlur={() => setTimeout(() => setOpen(false), 180)}
      placeholder="Например: Mor... или внут..."
      autoComplete="off"
      spellCheck="false"
    />
    {open && results.length > 0 && <div className="quick-results help-results">
      {results.map((item, index) => <button key={`${item.type}-${item.id || item.label}`} type="button" className={index === active ? 'active' : ''} onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}>
        <strong>{item.label}</strong>
        {item.type === 'route' && <span>Путь введения</span>}
      </button>)}
    </div>}
  </div>;
}
