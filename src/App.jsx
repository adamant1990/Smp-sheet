import { useMemo, useState } from 'react';
import { ClipboardList, Printer, RotateCcw, Settings, Share2, Stethoscope } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PrintSheet from './components/PrintSheet';
import DateWheelPicker from './components/DateWheelPicker';
import DiagnosisPicker from './components/DiagnosisPicker';
import DirectoryManager from './components/DirectoryManager';
import HelpAutocomplete from './components/HelpAutocomplete';
import { OrganizationPicker, SettlementPicker } from './components/DirectoryPicker';

const todayISO = () => new Date().toISOString().slice(0, 10);
const initialForm = { sheetNumber: '', surname: '', name: '', patronymic: '', birthDate: '', ageYears: '', ageMonths: '', sex: '', document: '', address: '', scene: '', sameAddress: false, diagnosis: '', circumstances: '', callDate: todayISO(), callTime: '', help: '', bloodPressure: '', temperature: '', glucose: '', lams: '', saturation: '', hospital: '', deliveryDate: todayISO(), deliveryTime: '', transport: '', stationDoctor: '', team: '', brigadeDoctor: '', notes: '' };
function Field({ label, name, value, onChange, type = 'text', placeholder = '', wide = false, readOnly = false, inputMode }) { return <label className={wide ? 'field field-wide' : 'field'}><span>{label}</span><input name={name} type={type} inputMode={inputMode} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} /></label>; }
function TextField({ label, name, value, onChange, rows = 3 }) { return <label className="field field-wide"><span>{label}</span><textarea name={name} rows={rows} value={value} onChange={onChange} /></label>; }
function calculateAge(birthDate) { if (!birthDate) return { years: '', months: '' }; const [year, month, day] = birthDate.split('-').map(Number); if (!year || !month || !day) return { years: '', months: '' }; const today = new Date(); let years = today.getFullYear() - year; let months = today.getMonth() + 1 - month; if (today.getDate() - day < 0) months -= 1; if (months < 0) { years -= 1; months += 12; } if (years < 0) return { years: '', months: '' }; return { years, months }; }
function formatBloodPressure(value) { const digits = value.replace(/\D/g, '').slice(0, 6); if (digits.length <= 3) return digits; return `${digits.slice(0, 3)}/${digits.slice(3)}`; }
function formatTemperature(value) { const digits = value.replace(/\D/g, '').slice(0, 3); if (digits.length < 3) return digits; return `${digits.slice(0, -1)},${digits.slice(-1)}`; }
function formatGlucose(value) { const digits = value.replace(/\D/g, '').slice(0, 3); if (digits.length < 2) return digits; const number = Number(digits) / 10; return Number.isInteger(number) ? `${number},0` : String(number).replace('.', ','); }
function formatName(value) { return value.replace(/(^|[\s-])([А-Яа-яЁё])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`); }
function formatTime(value) { const digits = value.replace(/\D/g, '').slice(0, 4); if (digits.length <= 2) return digits; return `${digits.slice(0, 2)}:${digits.slice(2)}`; }
function TimeField({ label, name, value, onChange }) { return <label className="field"><span>{label}</span><input name={name} type="text" inputMode="numeric" pattern="[0-9:]*" value={value} onChange={onChange} placeholder="Укажите время" /></label>; }
export default function App() {
  const [form, setForm] = useState(initialForm); const [directoriesOpen, setDirectoriesOpen] = useState(false); const [sharingPdf, setSharingPdf] = useState(false);
  const hasStroke = useMemo(() => /инсульт|ОНМК|ишемическ|геморрагическ/i.test(form.diagnosis), [form.diagnosis]);
  const update = (event) => { const { name, value, type, checked } = event.target; setForm(prev => { if (name === 'sameAddress') return { ...prev, sameAddress: checked, scene: checked ? prev.address : prev.scene }; if (name === 'address' && prev.sameAddress) return { ...prev, address: value, scene: value }; if (name === 'bloodPressure') return { ...prev, bloodPressure: formatBloodPressure(value) }; if (name === 'temperature') return { ...prev, temperature: formatTemperature(value) }; if (name === 'glucose') return { ...prev, glucose: formatGlucose(value) }; if (name === 'surname' || name === 'name' || name === 'patronymic') return { ...prev, [name]: formatName(value) }; if (name === 'callTime' || name === 'deliveryTime') return { ...prev, [name]: formatTime(value) }; return { ...prev, [name]: type === 'checkbox' ? checked : value }; }); };
  const updateBirthDate = value => { const age = calculateAge(value); setForm(prev => ({ ...prev, birthDate: value, ageYears: age.years === '' ? '' : String(age.years), ageMonths: age.months === '' ? '' : String(age.months) })); };
  const reset = () => setForm({ ...initialForm, callDate: todayISO(), deliveryDate: todayISO() });
  const sharePdf = async () => {
    if (sharingPdf) return;
    setSharingPdf(true);
    const printRoot = document.querySelector('.print-root');
    if (!printRoot) {
      window.alert('Не удалось найти печатную форму.');
      setSharingPdf(false);
      return;
    }
    const previousStyle = printRoot.getAttribute('style');
    document.documentElement.classList.add('pdf-export');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      Object.assign(printRoot.style, { position: 'fixed', left: '0', top: '0', zIndex: '-1', width: '297mm', overflow: 'visible' });
      const pages = Array.from(printRoot.querySelectorAll('.print-page'));
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          width: pages[index].scrollWidth,
          height: pages[index].scrollHeight,
          windowWidth: Math.max(document.documentElement.clientWidth, pages[index].scrollWidth),
        });
        if (index > 0) pdf.addPage('a4', 'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        canvas.width = 0;
        canvas.height = 0;
      }
      const blob = pdf.output('blob');
      const file = new File([blob], 'Сопроводительный-лист-СМП.pdf', { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: 'Сопроводительный лист СМП' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        window.setTimeout(() => { window.location.href = 'mailto:?subject=%D0%A1%D0%BE%D0%BF%D1%80%D0%BE%D0%B2%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%20%D0%BB%D0%B8%D1%81%D1%82%20%D0%A1%D0%9C%D0%9F&body=%D0%9F%D1%80%D0%B8%D0%BA%D1%80%D0%B5%D0%BF%D0%B8%D1%82%D0%B5%20%D0%BA%20%D0%BF%D0%B8%D1%81%D1%8C%D0%BC%D1%83%20%D1%81%D0%BE%D1%85%D1%80%D0%B0%D0%BD%D1%91%D0%BD%D0%BD%D1%8B%D0%B9%20PDF-%D1%84%D0%B0%D0%B9%D0%BB.'; }, 700);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Не удалось подготовить PDF:', error);
        window.alert('Не удалось подготовить PDF. Попробуйте воспользоваться кнопкой «Печать».');
      }
    } finally {
      if (previousStyle === null) printRoot.removeAttribute('style');
      else printRoot.setAttribute('style', previousStyle);
      document.documentElement.classList.remove('pdf-export');
      setSharingPdf(false);
    }
  };
  return <div className="app-shell"><div className="screen-ui"><header className="topbar"><div className="brand"><div className="brand-icon"><Stethoscope size={22} /></div><div><strong>Сопроводительный лист СМП</strong><small>Электронная форма • проект Smp-sheet</small></div></div><div className="actions"><button className="action-icon" type="button" onClick={() => setDirectoriesOpen(true)} aria-label="Настройки и справочники" title="Настройки и справочники"><Settings size={20} /></button><button className="action-icon" type="button" onClick={reset} aria-label="Очистить форму" title="Очистить форму"><RotateCcw size={20} /></button><button className="action-icon" type="button" onClick={sharePdf} disabled={sharingPdf} aria-label={sharingPdf ? 'Подготовка PDF' : 'Поделиться PDF'} title={sharingPdf ? 'Подготовка PDF' : 'Поделиться PDF'}><Share2 size={20} /></button><button className="action-icon" type="button" onClick={() => window.print()} aria-label="Печать" title="Печать"><Printer size={20} /></button></div></header><main className="workspace">
    <section className="intro"><div><p className="eyebrow">СОПРОВОДИТЕЛЬНЫЙ ЛИСТ И ТАЛОН К НЕМУ</p><h1>Заполнение листа</h1></div><div className="status"><ClipboardList size={18} /> Черновик</div></section>
    <section className="card"><div className="section-head"><span className="number">1</span><div><h2>Пациент</h2></div></div><div className="grid three"><Field label="№ сопроводительного листа" name="sheetNumber" value={form.sheetNumber} onChange={update} placeholder="Введите номер вручную"/><Field label="Фамилия" name="surname" value={form.surname} onChange={update}/><Field label="Имя" name="name" value={form.name} onChange={update}/><Field label="Отчество" name="patronymic" value={form.patronymic} onChange={update}/><DateWheelPicker value={form.birthDate} onChange={updateBirthDate}/><Field label="Возраст, лет" name="ageYears" value={form.ageYears} onChange={update} type="number" readOnly/><Field label="Возраст, месяцев" name="ageMonths" value={form.ageMonths} onChange={update} type="number" readOnly/><label className="field"><span>Пол</span><select name="sex" value={form.sex} onChange={update}><option value="">Не выбран</option><option>мужской</option><option>женский</option></select></label><Field label="Серия и номер документа" name="document" value={form.document} onChange={update} wide/><SettlementPicker label="Место жительства" name="address" value={form.address} onChange={update} wide /><SettlementPicker label="Место оказания СМП" name="scene" value={form.scene} onChange={update} wide readOnly={form.sameAddress} placeholder={form.sameAddress ? 'Совпадает с местом жительства' : 'Начните вводить населённый пункт'} /><label className="same-address"><input name="sameAddress" type="checkbox" checked={form.sameAddress} onChange={update}/> <span>Совпадает с местом жительства</span></label></div></section>
    <section className="card"><div className="section-head"><span className="number">2</span><div><h2>Состояние и помощь</h2><p>Диагноз, обстоятельства, медицинская помощь и дополнительные показатели.</p></div></div><div className="vitals"><Field label="АД, мм рт. ст." name="bloodPressure" value={form.bloodPressure} onChange={update} placeholder="12080" inputMode="numeric"/><Field label="Температура, °C" name="temperature" value={form.temperature} onChange={update} placeholder="368" inputMode="numeric"/><Field label="Глюкоза, ммоль/л" name="glucose" value={form.glucose} onChange={update} placeholder="5,4" inputMode="numeric"/><Field label="Сатурация, %" name="saturation" value={form.saturation} onChange={update} type="number" placeholder="98" inputMode="numeric"/><Field label="LAMS, баллы" name="lams" value={form.lams} onChange={update} type="number" placeholder="98" inputMode="numeric"/></div>{hasStroke && <div className="notice">Обнаружены признаки инсульта/ОНМК — перед печатью проверьте LAMS, глюкозу и сатурацию.</div>}<div className="grid two"><DiagnosisPicker value={form.diagnosis} onChange={update}/><TextField label="Обстоятельства заболевания / несчастного случая" name="circumstances" value={form.circumstances} onChange={update} rows={4}/><label className="field field-wide"><span>Оказанная медицинская помощь</span><HelpAutocomplete value={form.help} onChange={value => setForm(prev => ({ ...prev, help: value }))}/></label><Field label="Дата принятия вызова" name="callDate" value={form.callDate} onChange={update} type="date"/><TimeField label="Время принятия вызова" name="callTime" value={form.callTime} onChange={update}/></div></section>
    <section className="card"><div className="section-head"><span className="number">3</span><div><h2>Доставка и передача</h2><p>Сведения о стационаре, транспортировке и бригаде.</p></div></div><div className="grid two"><OrganizationPicker value={form.hospital} onChange={update}/><Field label="Дата доставки" name="deliveryDate" value={form.deliveryDate} onChange={update} type="date"/><TimeField label="Время доставки" name="deliveryTime" value={form.deliveryTime} onChange={update}/><label className="field"><span>Способ транспортировки</span><select name="transport" value={form.transport} onChange={update}><option value="">Не выбран</option><option value="на носилках">На носилках</option><option value="на руках">На руках</option><option value="пешком">Пешком</option></select></label><Field label="Врач / фельдшер бригады" name="brigadeDoctor" value={form.brigadeDoctor} onChange={update}/><Field label="Фельдшер / врач принимающего отделения" name="stationDoctor" value={form.stationDoctor} onChange={update}/><Field label="Состав бригады" name="team" value={form.team} onChange={update}/></div><TextField label="Примечания" name="notes" value={form.notes} onChange={update} rows={4}/></section>
  </main></div><PrintSheet form={form}/><DirectoryManager open={directoriesOpen} onClose={() => setDirectoriesOpen(false)}/></div>;
}
