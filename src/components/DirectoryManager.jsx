import { useEffect, useState } from 'react';

const STORAGE_KEY = 'smp-sheet-directories-v1';
const DEFAULT_DIRECTIONS = ['внутримышечно', 'внутривенно', 'подкожно', 'сублингвально'];

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      drugs: Array.isArray(saved?.drugs) ? saved.drugs : [],
      organizations: Array.isArray(saved?.organizations) ? saved.organizations : [],
    };
  } catch {
    return { drugs: [], organizations: [] };
  }
}

export function getDirectoryData() {
  return loadData();
}

export function saveDirectoryData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('smp-directories-updated'));
}

export function suggestDirections(query) {
  const q = query.trim().toLowerCase().replace(/ё/g, 'е');
  if (!q) return DEFAULT_DIRECTIONS;
  return DEFAULT_DIRECTIONS.filter(item => item.includes(q));
}

export default function DirectoryManager({ open, onClose }) {
  const [tab, setTab] = useState('drugs');
  const [data, setData] = useState(loadData);
  const [drug, setDrug] = useState({ name: '', dose: '', route: '' });
  const [organization, setOrganization] = useState('');

  useEffect(() => {
    if (open) setData(loadData());
  }, [open]);

  if (!open) return null;

  const persist = (next) => { setData(next); saveDirectoryData(next); };
  const addDrug = (event) => {
    event.preventDefault();
    if (!drug.name.trim()) return;
    persist({ ...data, drugs: [...data.drugs, { id: Date.now(), ...drug, name: drug.name.trim(), dose: drug.dose.trim(), route: drug.route.trim() }] });
    setDrug({ name: '', dose: '', route: '' });
  };
  const addOrganization = (event) => {
    event.preventDefault();
    if (!organization.trim()) return;
    persist({ ...data, organizations: [...data.organizations, { id: Date.now(), name: organization.trim() }] });
    setOrganization('');
  };
  const removeDrug = (id) => persist({ ...data, drugs: data.drugs.filter(item => item.id !== id) });
  const removeOrganization = (id) => persist({ ...data, organizations: data.organizations.filter(item => item.id !== id) });

  return <div className="directory-overlay" onMouseDown={onClose}>
    <div className="directory-modal" onMouseDown={event => event.stopPropagation()}>
      <div className="directory-head"><div><h2>Справочники</h2><p>Ваши лекарства и медицинские организации сохраняются на этом устройстве.</p></div><button type="button" onClick={onClose}>×</button></div>
      <div className="directory-tabs"><button className={tab === 'drugs' ? 'active' : ''} onClick={() => setTab('drugs')}>💊 Лекарства</button><button className={tab === 'organizations' ? 'active' : ''} onClick={() => setTab('organizations')}>🏥 Медорганизации</button></div>
      {tab === 'drugs' ? <>
        <form className="directory-form" onSubmit={addDrug}>
          <label><span>Название на латыни</span><input value={drug.name} onChange={e => setDrug({ ...drug, name: e.target.value })} placeholder="Sol. Metamizoli" /></label>
          <label><span>Дозировка</span><input value={drug.dose} onChange={e => setDrug({ ...drug, dose: e.target.value })} placeholder="50% — 2 ml" /></label>
          <label><span>Путь введения</span><input list="route-suggestions" value={drug.route} onChange={e => setDrug({ ...drug, route: e.target.value })} placeholder="Начните писать: подк..." /><datalist id="route-suggestions">{DEFAULT_DIRECTIONS.map(item => <option key={item} value={item} />)}</datalist></label>
          <button className="directory-add" type="submit">Добавить препарат</button>
        </form>
        <div className="directory-list">{data.drugs.length === 0 ? <div className="directory-empty">Пока нет препаратов. Добавьте часто используемые лекарства.</div> : data.drugs.map(item => <div className="directory-item" key={item.id}><div><strong>{item.name}</strong><span>{item.dose}{item.dose && item.route ? ' · ' : ''}{item.route}</span></div><button type="button" onClick={() => removeDrug(item.id)}>Удалить</button></div>)}</div>
      </> : <>
        <form className="directory-form organization-form" onSubmit={addOrganization}><label><span>Название медицинской организации</span><input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="ГБУЗ РБ Туймазинская ЦРБ" /></label><button className="directory-add" type="submit">Добавить организацию</button></form>
        <div className="directory-list">{data.organizations.length === 0 ? <div className="directory-empty">Пока нет организаций. Добавьте те, куда чаще доставляете пациентов.</div> : data.organizations.map(item => <div className="directory-item" key={item.id}><strong>{item.name}</strong><button type="button" onClick={() => removeOrganization(item.id)}>Удалить</button></div>)}</div>
      </>}
    </div>
  </div>;
}
