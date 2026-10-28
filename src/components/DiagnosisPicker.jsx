import { useEffect, useMemo, useState } from 'react';
import { ICD10_ITEMS } from '../data/icd10';

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

function normalizeCode(value) {
  return normalize(value).replace(/[\s.-]/g, '');
}

export default function DiagnosisPicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    const codeQuery = normalizeCode(q);
    return ICD10_ITEMS
      .map((item) => {
        const name = normalize(item.name);
        const code = normalize(item.code);
        const compactCode = normalizeCode(item.code);
        let rank = 99;

        if (code === q || compactCode === codeQuery) rank = 0;
        else if (code.startsWith(q) || compactCode.startsWith(codeQuery)) rank = 1;
        else if (name.startsWith(q)) rank = 2;
        else if (code.includes(q) || compactCode.includes(codeQuery)) rank = 3;
        else if (name.includes(q)) rank = 4;

        return { ...item, rank };
      })
      .filter((item) => item.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.code.localeCompare(b.code, 'ru'))
      .slice(0, 8);
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
              <button
                key={item.code}
                type="button"
                className="diagnosis-result"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
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
