import { useEffect, useMemo, useState } from 'react';
import { ICD10_ITEMS } from '../data/icd10';

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

function normalizeCode(value) {
  return normalize(value).replace(/[\s.-]/g, '');
}

function searchDiagnoses(query) {
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
}

function DiagnosisEntry({ value, index, onChange, onRemove, canRemove }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchDiagnoses(query), [query]);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const update = (next) => {
    setQuery(next);
    onChange(index, next);
  };

  const choose = (item) => {
    update(`${item.code} — ${item.name}`);
    setOpen(false);
  };

  return (
    <div className="diagnosis-entry">
      <div className="diagnosis-entry-heading">
        <strong>{index === 0 ? 'Основной диагноз' : `Сопутствующий диагноз ${index}`}</strong>
        {canRemove && (
          <button type="button" className="diagnosis-remove" onClick={() => onRemove(index)} aria-label={`Удалить диагноз ${index + 1}`}>
            Удалить
          </button>
        )}
      </div>
      <div className="diagnosis-input-wrap">
        <textarea
          name="diagnosis"
          rows={2}
          value={query}
          onChange={(event) => {
            update(event.target.value);
            setOpen(Boolean(event.target.value.trim()));
          }}
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
    </div>
  );
}

function parseDiagnoses(value) {
  if (!value) return [''];
  // Старые карты по-прежнему читаются из единственного поля diagnosis.
  // Переносы строк становятся отдельными позициями, а при печати сохраняются.
  const lines = String(value).split(/\r?\n/);
  return lines.length ? lines : [''];
}

export default function DiagnosisPicker({ value, onChange }) {
  const [diagnoses, setDiagnoses] = useState(() => parseDiagnoses(value));

  useEffect(() => {
    setDiagnoses(parseDiagnoses(value));
  }, [value]);

  const commit = (next) => {
    setDiagnoses(next);
    onChange({ target: { name: 'diagnosis', value: next.filter((item) => item.trim()).join('\n') } });
  };

  const updateDiagnosis = (index, nextValue) => {
    commit(diagnoses.map((item, itemIndex) => itemIndex === index ? nextValue : item));
  };

  const addDiagnosis = () => {
    setDiagnoses((current) => [...current, '']);
  };

  const removeDiagnosis = (index) => {
    const next = diagnoses.filter((_, itemIndex) => itemIndex !== index);
    commit(next.length ? next : ['']);
  };

  return (
    <div className="field field-wide diagnosis-picker">
      <span>Диагноз врача (фельдшера) бригады СМП</span>
      <div className="diagnosis-list">
        {diagnoses.map((diagnosis, index) => (
          <DiagnosisEntry
            key={index}
            value={diagnosis}
            index={index}
            onChange={updateDiagnosis}
            onRemove={removeDiagnosis}
            canRemove={diagnoses.length > 1}
          />
        ))}
      </div>
      <button type="button" className="diagnosis-add" onClick={addDiagnosis}>
        + Добавить диагноз
      </button>
      <small className="diagnosis-hint">Первый диагноз считается основным, остальные — сопутствующими. В печатную форму попадут все заполненные диагнозы.</small>
    </div>
  );
}
