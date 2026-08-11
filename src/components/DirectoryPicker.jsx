import { useEffect, useMemo, useState } from 'react';
import { getDirectoryData, suggestDirections } from './DirectoryManager';

function normalize(value) { return value.trim().toLowerCase().replace(/ё/g, 'е'); }

export function DrugPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(getDirectoryData);
  useEffect(() => { const refresh = () => setData(getDirectoryData()); window.addEventListener('smp-directories-updated', refresh); return () => window.removeEventListener('smp-directories-updated', refresh); }, []);
  const results = useMemo(() => { const q = normalize(query); if (!q) return data.drugs.slice(0, 8); return data.drugs.filter(item => normalize(`${item.name} ${item.dose} ${item.route}`).includes(q)).slice(0, 8); }, [query, data]);
  const choose = item => { const text = [item.name, item.dose, item.route].filter(Boolean).join(' — '); onChange(text); setQuery(''); setOpen(false); };
  return <div className="quick-picker"><label><span>Добавить препарат из справочника</span><input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Начните вводить название..." autoComplete="off" /></label>{open && data.drugs.length > 0 && <div className="quick-results">{results.map(item => <button key={item.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => choose(item)}><strong>{item.name}</strong><span>{[item.dose, item.route].filter(Boolean).join(' · ')}</span></button>)}</div>}</div>;
}

export function OrganizationPicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(getDirectoryData);
  useEffect(() => { const refresh = () => setData(getDirectoryData()); window.addEventListener('smp-directories-updated', refresh); return () => window.removeEventListener('smp-directories-updated', refresh); }, []);
  const results = useMemo(() => { const q = normalize(query); if (!q) return []; return data.organizations.filter(item => normalize(item.name).includes(q)).slice(0, 8); }, [query, data]);
  const change = event => { setQuery(event.target.value); onChange(event); setOpen(true); };
  const choose = item => { setQuery(item.name); onChange({ target: { name: 'hospital', value: item.name } }); setOpen(false); };
  return <label className="field organization-picker"><span>Стационар / медицинская организация</span><div className="quick-input-wrap"><input name="hospital" value={query} onChange={change} onFocus={() => setOpen(Boolean(query.trim()))} placeholder="Начните вводить название" autoComplete="off" />{open && results.length > 0 && <div className="quick-results">{results.map(item => <button key={item.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => choose(item)}>{item.name}</button>)}</div>}</div></label>;
}

export function RouteHint({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const results = suggestDirections(value);
  return <div className="route-hint"><input value={value} onChange={onChange} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Начните писать: подк..." autoComplete="off" />{open && value.trim() && results.length > 0 && <div className="quick-results">{results.map(item => <button key={item} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { onChange({ target: { value: item } }); setOpen(false); }}>{item}</button>)}</div>}</div>;
}
