import { useMemo, useState } from 'react';
import { ICD10_ITEMS } from '../data/icd10';

function normalize(value) {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

export default function DiagnosisPicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return ICD10_ITEMS.filter(({ code, name }) => normalize(code).includes(q) || normalize(name).includes(q)).slice(0, 8);
  }, [query]);

  const choose = (item) => {
    const text = `${item.code} — ${item.name}`;
    setQuery(text);
    onChange({ target: { name: 'diagnosis', value: text } });
    setOpen(false);
  };

  const handleChange = (event) => {
    const next = event.target.value;
    setQuery(next);
    onChange(event);
    setOpen(Boolean(next.trim()));
  };

  return (
    <label className="field field-wide diagnosis-picker">
      <span>Диагноз врача (фельдшера) бригады СМП</span>
      <div className="diagnosis-input-wrap">
        <textarea
          name="diagnosis"
          rows={4}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(Boolean(query.trim()))}
          placeholder="Введите код МКБ-10 или название диагноза"
          autoComplete="off"
        />
        {open && results.length > 0 && (
          <div className="diagnosis-results">
            {results.map((item) => (
              <button key={item.code} type="button" className="diagnosis-result" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)}>
                <strong>{item.code}</strong>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        )}
        {open && query.trim() && results.length === 0 && (
          <div className="diagnosis-empty">По этому запросу ничего не найдено в локальном справочнике.</div>
        )}
      </div>
    </label>
  );
}
