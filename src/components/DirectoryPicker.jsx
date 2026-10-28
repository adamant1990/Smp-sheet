import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function normalize(value) { return (value || '').trim().toLowerCase().replace(/ё/g, 'е'); }

async function fetchItems(table) {
  const { data, error } = await supabase.from(table).select('id,name').order('name');
  if (error) throw error;
  return data || [];
}

export function DrugPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [drugs, setDrugs] = useState([]);
  useEffect(() => {
    let alive = true;
    const refresh = async () => { try { const rows = await fetchItems('drugs'); if (alive) setDrugs(rows); } catch (error) { console.error('Не удалось загрузить справочник лекарств:', error); } };
    refresh();
    window.addEventListener('smp-directories-updated', refresh);
    return () => { alive = false; window.removeEventListener('smp-directories-updated', refresh); };
  }, []);
  const results = useMemo(() => { const q = normalize(query); if (!q) return drugs.slice(0, 8); return drugs.filter(item => normalize(item.name).includes(q)).slice(0, 8); }, [query, drugs]);
  const choose = item => { onChange(item.name); setQuery(''); setOpen(false); };
  return <div className="quick-picker"><label><span>Добавить препарат из справочника</span><input value={query} onChange={event => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Начните вводить название..." autoComplete="off" /></label>{open && results.length > 0 && <div className="quick-results">{results.map(item => <button key={item.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}><strong>{item.name}</strong></button>)}</div>}</div>;
}

export function OrganizationPicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  useEffect(() => {
    let alive = true;
    const refresh = async () => { try { const rows = await fetchItems('medical_organizations'); if (alive) setOrganizations(rows); } catch (error) { console.error('Не удалось загрузить справочник организаций:', error); } };
    refresh();
    window.addEventListener('smp-directories-updated', refresh);
    return () => { alive = false; window.removeEventListener('smp-directories-updated', refresh); };
  }, []);
  useEffect(() => { setQuery(value || ''); }, [value]);
  const results = useMemo(() => { const q = normalize(query); if (!q) return []; return organizations.filter(item => normalize(item.name).includes(q)).slice(0, 8); }, [query, organizations]);
  const change = event => { setQuery(event.target.value); onChange(event); setOpen(true); };
  const choose = item => { setQuery(item.name); onChange({ target: { name: 'hospital', value: item.name } }); setOpen(false); };
  return <label className="field organization-picker"><span>Стационар / медицинская организация</span><div className="quick-input-wrap"><input name="hospital" value={query} onChange={change} onFocus={() => setOpen(Boolean(query.trim()))} placeholder="Начните вводить название" autoComplete="off" /><div className="quick-results" style={{ display: open && results.length ? 'block' : 'none' }}>{results.map(item => <button key={item.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}>{item.name}</button>)}</div></div></label>;
}


export function SettlementPicker({ name, value, onChange, label, readOnly = false, wide = true, placeholder = 'Начните вводить населённый пункт' }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [settlements, setSettlements] = useState([]);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const { data, error } = await supabase.from('settlements').select('id,settlement_type,name').order('name');
        if (error) throw error;
        if (alive) setSettlements(data || []);
      } catch (error) {
        console.error('Не удалось загрузить справочник населённых пунктов:', error);
      }
    };
    refresh();
    window.addEventListener('smp-directories-updated', refresh);
    return () => { alive = false; window.removeEventListener('smp-directories-updated', refresh); };
  }, []);
  useEffect(() => { setQuery(value || ''); }, [value]);
  const results = useMemo(() => {
    const q = normalize(query.replace(/^(д\\.|г\\.|с\\.|п\\.|ст\\.|х\\.)\\s*/i, ''));
    if (!q) return settlements.slice(0, 8);
    return settlements.filter(item => normalize(item.name).includes(q) || normalize(item.settlement_type + ' ' + item.name).includes(normalize(query))).slice(0, 8);
  }, [query, settlements]);
  const change = event => {
    setQuery(event.target.value);
    onChange({ target: { name, value: event.target.value } });
    setOpen(true);
  };
  const choose = item => {
    const fullName = `${item.settlement_type} ${item.name}`;
    setQuery(fullName);
    onChange({ target: { name, value: fullName } });
    setOpen(false);
  };
  return <label className={wide ? "field field-wide settlement-picker" : "field settlement-picker"}>
    <span>{label}</span>
    <div className="quick-input-wrap">
      <input name={name} value={query} onChange={change} onFocus={() => !readOnly && setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} placeholder={placeholder} autoComplete="off" readOnly={readOnly} />
      {open && !readOnly && results.length > 0 && <div className="quick-results">{results.map(item => <button key={item.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}><strong>{item.settlement_type} {item.name}</strong></button>)}</div>}
    </div>
  </label>;
}

export function RouteHint({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const results = ['внутримышечно', 'внутривенно', 'подкожно', 'сублингвально'].filter(item => normalize(item).includes(normalize(value)));
  return <div className="route-hint"><input value={value} onChange={onChange} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} placeholder="Начните писать: подк..." autoComplete="off" />{open && value.trim() && results.length > 0 && <div className="quick-results">{results.map(item => <button key={item} type="button" onMouseDown={event => event.preventDefault()} onClick={() => { onChange({ target: { value: item } }); setOpen(false); }}>{item}</button>)}</div>}</div>;
}
