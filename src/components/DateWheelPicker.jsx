import React, { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function parseValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

function formatInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function toISO(displayValue) {
  const digits = String(displayValue || '').replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (!year || month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return '';
  return `${year}-${pad(month)}-${pad(day)}`;
}

export default function DateWheelPicker({ value, onChange }) {
  const [displayValue, setDisplayValue] = useState(parseValue(value));

  useEffect(() => {
    setDisplayValue(parseValue(value));
  }, [value]);

  const handleChange = (event) => {
    const next = formatInput(event.target.value);
    setDisplayValue(next);
    const iso = toISO(next);
    if (iso) onChange(iso);
    else if (next.replace(/\D/g, '').length === 0) onChange('');
  };

  return <label className="date-picker-field">
    <span>Дата рождения</span>
    <input
      className={displayValue ? 'date-display has-value' : 'date-display'}
      type="text"
      inputMode="numeric"
      pattern="[0-9.]*"
      value={displayValue}
      onChange={handleChange}
      placeholder="ДД.ММ.ГГГГ"
      maxLength={10}
      autoComplete="bday"
    />
  </label>;
}
