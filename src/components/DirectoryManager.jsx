import { useEffect, useState } from 'react';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';

const EMPTY = { drugs: [], organizations: [], settlements: [] };
const TABS = [
  { id: 'drugs', label: '💊 Лекарства', table: 'drugs' },
  { id: 'organizations', label: '🏥 Медорганизации', table: 'medical_organizations' },
  { id: 'settlements', label: '📍 Населённые пункты', table: 'settlements' },
];
const SETTLEMENT_TYPES = ['г.', 'с.', 'д.', 'п.', 'ст.', 'х.', 'аул', 'рп'];

async function fetchDirectories() {
  const [drugsResult, orgsResult, settlementsResult] = await Promise.all([
    supabase.from('drugs').select('id,name').order('name'),
    supabase.from('medical_organizations').select('id,name').order('name'),
    supabase.from('settlements').select('id,settlement_type,name').order('name'),
  ]);
  if (drugsResult.error) throw drugsResult.error;
  if (orgsResult.error) throw orgsResult.error;
  if (settlementsResult.error) throw settlementsResult.error;
  return {
    drugs: drugsResult.data || [],
    organizations: orgsResult.data || [],
    settlements: settlementsResult.data || [],
  };
}

export default function DirectoryManager({ open, onClose }) {
  const [tab, setTab] = useState('drugs');
  const [data, setData] = useState(EMPTY);
  const [session, setSession] = useState(null);
  const [drugName, setDrugName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [settlementName, setSettlementName] = useState('');
  const [settlementType, setSettlementType] = useState('с.');
  const [password, setPassword] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('с.');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
  const currentTab = TABS.find(item => item.id === tab) || TABS[0];

  const refresh = async () => {
    setLoading(true);
    setError('');
    try { setData(await fetchDirectories()); }
    catch (err) { setError(err.message || 'Не удалось загрузить справочники.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => setSession(currentSession));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      window.dispatchEvent(new Event('smp-directories-updated'));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (open) refresh(); }, [open]);
  useEffect(() => {
    const refreshOnChange = () => { if (open) refresh(); };
    window.addEventListener('smp-directories-updated', refreshOnChange);
    return () => window.removeEventListener('smp-directories-updated', refreshOnChange);
  }, [open]);

  if (!open) return null;

  const signInAdmin = async event => {
    event.preventDefault();
    if (!password) { setError('Введите пароль администратора.'); return; }
    setBusy(true); setNotice(''); setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
      if (authError) throw authError;
      setPassword('');
      setNotice('Вход выполнен.');
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Неверный email или пароль.' : (err.message || 'Не удалось войти.'));
    } finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true);
    const { error: authError } = await supabase.auth.signOut();
    setBusy(false);
    if (authError) setError(authError.message);
    else { setNotice('Вы вышли из режима администратора.'); setEditing(null); }
  };

  const saveRecord = async event => {
    event.preventDefault();
    let payload;
    if (tab === 'drugs') {
      const name = drugName.trim();
      if (!name) return;
      payload = { name };
    } else if (tab === 'organizations') {
      const name = organizationName.trim();
      if (!name) return;
      payload = { name };
    } else {
      const name = settlementName.trim();
      if (!name) return;
      payload = { settlement_type: settlementType, name };
    }
    setBusy(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from(currentTab.table).insert(payload);
    setBusy(false);
    if (saveError) {
      setError(saveError.code === '23505' ? 'Такая запись уже существует.' : saveError.message);
      return;
    }
    if (tab === 'drugs') setDrugName('');
    if (tab === 'organizations') setOrganizationName('');
    if (tab === 'settlements') setSettlementName('');
    setNotice('Запись добавлена в общий справочник.');
    await refresh();
    window.dispatchEvent(new Event('smp-directories-updated'));
  };

  const saveEdit = async event => {
    event.preventDefault();
    if (!editing || !editName.trim()) return;
    const payload = tab === 'settlements'
      ? { settlement_type: editType, name: editName.trim(), updated_at: new Date().toISOString() }
      : { name: editName.trim(), updated_at: new Date().toISOString() };
    setBusy(true); setError('');
    const { error: saveError } = await supabase.from(currentTab.table).update(payload).eq('id', editing.id);
    setBusy(false);
    if (saveError) {
      setError(saveError.code === '23505' ? 'Такая запись уже существует.' : saveError.message);
      return;
    }
    setEditing(null);
    setNotice('Изменения сохранены.');
    await refresh();
    window.dispatchEvent(new Event('smp-directories-updated'));
  };

  const deleteRecord = async item => {
    const displayName = tab === 'settlements' ? `${item.settlement_type} ${item.name}` : item.name;
    if (!window.confirm(`Удалить запись «${displayName}» из общего справочника?`)) return;
    setBusy(true); setError('');
    const { error: deleteError } = await supabase.from(currentTab.table).delete().eq('id', item.id);
    setBusy(false);
    if (deleteError) { setError(deleteError.message); return; }
    setNotice('Запись удалена.');
    await refresh();
    window.dispatchEvent(new Event('smp-directories-updated'));
  };

  const items = data[tab] || [];
  return <div className="directory-overlay" onMouseDown={onClose}>
    <div className="directory-modal" onMouseDown={event => event.stopPropagation()}>
      <div className="directory-head">
        <div><h2>Общие справочники</h2><p>Записи хранятся в общей базе Supabase и доступны на всех устройствах.</p></div>
        <button type="button" onClick={onClose} aria-label="Закрыть">×</button>
      </div>
      <div className="directory-auth">
        {isAdmin ? <><span className="directory-admin-status">Вы вошли как администратор: {session.user.email}</span><button type="button" onClick={signOut} disabled={busy}>Выйти</button></> :
          <><span>Просмотр доступен всем. Для управления справочниками войдите как администратор.</span><form className="directory-login-form" onSubmit={signInAdmin}><label><span>Email администратора</span><input type="email" value={ADMIN_EMAIL} readOnly /></label><label><span>Пароль</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Введите пароль" autoComplete="current-password" required /></label><button type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button></form></>}
      </div>
      {notice && <div className="directory-notice" role="status">{notice}</div>}
      {error && <div className="directory-error" role="alert">{error}</div>}
      <div className="directory-tabs">{TABS.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setEditing(null); }}>{item.label} ({data[item.id].length})</button>)}</div>
      {isAdmin && <form className={tab === 'settlements' ? 'directory-form settlement-form' : tab === 'organizations' ? 'directory-form organization-form' : 'directory-form directory-form-single'} onSubmit={saveRecord}>
        {tab === 'drugs' ? <label><span>Полное название препарата</span><input value={drugName} onChange={event => setDrugName(event.target.value)} placeholder="Sol. Magnesii Sulfatis 25% - 5,0" required /></label> :
          tab === 'organizations' ? <label><span>Полное название медицинской организации</span><input value={organizationName} onChange={event => setOrganizationName(event.target.value)} placeholder="ГБУЗ Туймазинская ЦРБ" required /></label> :
            <><label><span>Тип населённого пункта</span><select value={settlementType} onChange={event => setSettlementType(event.target.value)}>{SETTLEMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label><label><span>Название</span><input value={settlementName} onChange={event => setSettlementName(event.target.value)} placeholder="Например, Ильчимбетово" required /></label></>}
        <button className="directory-add" type="submit" disabled={busy}>Добавить</button>
      </form>}
      <div className="directory-list">
        {loading ? <div className="directory-empty">Загружаем общий справочник…</div> : items.length === 0 ? <div className="directory-empty">Записей пока нет.</div> : items.map(item => {
          const displayName = tab === 'settlements' ? `${item.settlement_type} ${item.name}` : item.name;
          return <div className="directory-item" key={item.id}>
            {isAdmin && editing?.id === item.id ? <form className="directory-edit-form" onSubmit={saveEdit}>
              {tab === 'settlements' && <select value={editType} onChange={event => setEditType(event.target.value)}>{SETTLEMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>}
              <input value={editName} onChange={event => setEditName(event.target.value)} autoFocus required />
              <button type="submit" disabled={busy}>Сохранить</button><button type="button" onClick={() => setEditing(null)}>Отмена</button>
            </form> : <><strong>{displayName}</strong>{isAdmin && <div className="directory-item-actions"><button type="button" onClick={() => { setEditing(item); setEditName(item.name); setEditType(item.settlement_type || 'с.'); }}>Изменить</button><button type="button" onClick={() => deleteRecord(item)} disabled={busy}>Удалить</button></div>}</>}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
