import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_DIRECTIONS = ['внутримышечно', 'внутривенно', 'подкожно', 'сублингвально'];
const norm = value => String(value || '').toLowerCase().replace(/ё/g, 'е').trim();
const suggestDirections = query => {
  const q = norm(query);
  return q ? DEFAULT_DIRECTIONS.filter(item => norm(item).includes(q)) : [];
};

export default function HelpAutocomplete({ value, onChange }) {
  const [data, setData] = useState({ drugs: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const { data: drugs, error } = await supabase.from('drugs').select('id,name').order('name');
      if (!cancelled && !error) setData({ drugs: drugs || [] });
    };
    refresh();
    window.addEventListener('smp-directories-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('smp-directories-updated', refresh);
    };
  }, []);

  const text = String(value || '');
  const currentToken = useMemo(() => {
    const match = text.match(/(^|[\\s,;])([^\\s,;]*)$/);
    return match ? match[2] : '';
  }, [text]);
  const query = norm(currentToken);
  const directions = useMemo(() => suggestDirections(currentToken), [currentToken]);
  const drugs = useMemo(() => {
    if (!query || directions.length) return [];
    return data.drugs.filter(item => norm(item.name).includes(query)).slice(0, 8);
  }, [data, query, directions.length]);
  const results = directions.length
    ? directions.map(label => ({ type: 'route', label }))
    : drugs.map(item => ({ type: 'drug', ...item, label: item.name }));

  const replaceCurrentToken = replacement => {
    const match = text.match(/(^|[\\s,;])([^\\s,;]*)$/);
    if (!match) return `${text}${replacement}`;
    return `${text.slice(0, text.length - match[2].length)}${replacement}`;
  };

  const choose = item => {
    const replacement = `${item.label} `;
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
