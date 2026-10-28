import { useEffect, useState } from 'react';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';

const EMPTY = { drugs: [], organizations: [] };

async function fetchDirectories() {
  const [drugsResult, orgsResult] = await Promise.all([
    supabase.from('drugs').select('id,name').order('name'),
    supabase.from('medical_organizations').select('id,name').order('name'),
  ]);
  if (drugsResult.error) throw drugsResult.error;
  if (orgsResult.error) throw orgsResult.error;
  return { drugs: drugsResult.data || [], organizations: orgsResult.data || [] };
}

export default function DirectoryManager({ open, onClose }) {
  const [tab, setTab] = useState('drugs');
  const [data, setData] = useState(EMPTY);
  const [session, setSession] = useState(null);
  const [drugName, setDrugName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL;

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchDirectories());
    } catch (err) {
      setError(err.message || 'Не удалось загрузить справочники.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => setSession(currentSession));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      window.dispatchEvent(new Event('smp-directories-updated'));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  useEffect(() => {
    const refreshOnChange = () => { if (open) refresh(); };
    window.addEventListener('smp-directories-updated', refreshOnChange);
    return () => window.removeEventListener('smp-directories-updated', refreshOnChange);
  }, [open]);

  if (!open) return null;

  const sendLoginLink = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: ADMIN_EMAIL,
        options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
      });
      if (authError) throw authError;
      setNotice(`Ссылка для входа отправлена на ${ADMIN_EMAIL}. Откройте письмо на этом устройстве.`);
    } catch (err) {
      setError(err.message || 'Не удалось отправить ссылку для входа.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    const { error: authError } = await supabase.auth.signOut();
    setBusy(false);
    if (authError) setError(authError.message);
    else { setNotice('Вы вышли из режима администратора.'); setEditing(null); }
  };

  const saveRecord = async (event, type) => {
    event.preventDefault();
    const isDrug = type === 'drugs';
    const name = (isDrug ? drugName : organizationName).trim();
    if (!name) return;
    setBusy(true);
    setError('');
    setNotice('');
    const { error: saveError } = await supabase.from(type).insert({ name });
    setBusy(false);
    if (saveError) { setError(saveError.code === '23505' ? 'Такая запись уже существует.' : saveError.message); return; }
    if (isDrug) setDrugName(''); else setOrganizationName('');
    setNotice('Запись добавлена в общий справочник.');
    await refresh();
    window.dispatchEvent(new Event('smp-directories-updated'));
  };

  const saveEdit = async (event, type) => {
    event.preventDefault();
    if (!editing || !editName.trim()) return;
    setBusy(true);
    setError('');
    const { error: saveError } = await supabase.from(type).update({ name: editName.trim(), updated_at: new Date().toISOString() }).eq('id', editing.id);
    setBusy(false);
    if (saveError) { setError(saveError.code === '23505' ? 'Такая запись уже существует.' : saveError.message); return; }
    setEditing(null);
    setNotice('Изменения сохранены.');
    await refresh();
    window.dispatchEvent(new Event('smp-directories-updated'));
  };

  const deleteRecord = async (type, item) => {
    if (!window.confirm(`Удалить запись «${item.name}» из общего справочника?`)) return;
    setBusy(true);
    setError('');
    const { error: deleteError } = await supabase.from(type).delete().eq('id', item.id);
    setBusy(false);
    if (deleteError) { setError(deleteError.message); return; }
    setNotice('Запись удалена.');
    await refresh();
    window.dispatchEvent(new Event('smp-directories-updated'));
  };

  const items = tab === 'drugs' ? data.drugs : data.organizations;
  const tableName = tab === 'drugs' ? 'drugs' : 'medical_organizations';

  return <div className="directory-overlay" onMouseDown={onClose}>
    <div className="directory-modal" onMouseDown={event => event.stopPropagation()}>
      <div className="directory-head">
        <div><h2>Общие справочники</h2><p>Записи хранятся в общей базе Supabase и доступны на всех устройствах.</p></div>
        <button type="button" onClick={onClose} aria-label="Закрыть">×</button>
      </div>
      <div className="directory-auth">
        {isAdmin ? <><span className="directory-admin-status">Вы вошли как администратор: {session.user.email}</span><button type="button" onClick={signOut} disabled={busy}>Выйти</button></> :
          <><span>Просмотр доступен всем. Изменение справочников доступно только администратору.</span><button type="button" onClick={sendLoginLink} disabled={busy}>{busy ? 'Отправляем…' : 'Войти администратору'}</button></>}
      </div>
      {notice && <div className="directory-notice" role="status">{notice}</div>}
      {error && <div className="directory-error" role="alert">{error}</div>}
      <div className="directory-tabs"><button className={tab === 'drugs' ? 'active' : ''} onClick={() => { setTab('drugs'); setEditing(null); }}>💊 Лекарства ({data.drugs.length})</button><button className={tab === 'organizations' ? 'active' : ''} onClick={() => { setTab('organizations'); setEditing(null); }}>🏥 Медорганизации ({data.organizations.length})</button></div>
      {isAdmin && (tab === 'drugs' ? <form className="directory-form directory-form-single" onSubmit={event => saveRecord(event, 'drugs')}><label><span>Полное название препарата</span><input value={drugName} onChange={event => setDrugName(event.target.value)} placeholder="Sol. Magnesii Sulfatis 25% - 5,0" required /></label><button className="directory-add" type="submit" disabled={busy}>Добавить</button></form> :
        <form className="directory-form organization-form" onSubmit={event => saveRecord(event, 'medical_organizations')}><label><span>Полное название медицинской организации</span><input value={organizationName} onChange={event => setOrganizationName(event.target.value)} placeholder="ГБУЗ Туймазинская ЦРБ" required /></label><button className="directory-add" type="submit" disabled={busy}>Добавить</button></form>)}
      <div className="directory-list">
        {loading ? <div className="directory-empty">Загружаем общий справочник…</div> : items.length === 0 ? <div className="directory-empty">Записей пока нет.</div> : items.map(item => <div className="directory-item" key={item.id}>
          {isAdmin && editing?.id === item.id ? <form className="directory-edit-form" onSubmit={event => saveEdit(event, tableName)}><input value={editName} onChange={event => setEditName(event.target.value)} autoFocus required /><button type="submit" disabled={busy}>Сохранить</button><button type="button" onClick={() => setEditing(null)}>Отмена</button></form> :
            <><strong>{item.name}</strong>{isAdmin && <div className="directory-item-actions"><button type="button" onClick={() => { setEditing(item); setEditName(item.name); }}>Изменить</button><button type="button" onClick={() => deleteRecord(tableName, item)} disabled={busy}>Удалить</button></div>}</>}
        </div>)}
      </div>
    </div>
  </div>;
}
