import { useMemo, useState } from 'react';
import { ClipboardList, Printer, RotateCcw, Stethoscope } from 'lucide-react';
import PrintSheet from './components/PrintSheet';
import DateWheelPicker from './components/DateWheelPicker';
import DiagnosisPicker from './components/DiagnosisPicker';

const initialForm = {
  surname: '', name: '', patronymic: '', birthDate: '', ageYears: '', ageMonths: '', sex: '', document: '', address: '', scene: '', diagnosis: '', circumstances: '', callTime: '', help: '', bloodPressure: '', temperature: '', glucose: '', lams: '', hospital: '', deliveryTime: '', transport: '', stationDoctor: '', team: '', brigadeDoctor: '', notes: '',
};

function Field({ label, name, value, onChange, type = 'text', placeholder = '', wide = false }) {
  return <label className={wide ? 'field field-wide' : 'field'}><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} /></label>;
}
function TextField({ label, name, value, onChange, rows = 3 }) {
  return <label className="field field-wide"><span>{label}</span><textarea name={name} rows={rows} value={value} onChange={onChange} /></label>;
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const hasStroke = useMemo(() => /инсульт|ОНМК|ишемическ|геморрагическ/i.test(form.diagnosis), [form.diagnosis]);
  const update = (event) => { const { name, value } = event.target; setForm((prev) => ({ ...prev, [name]: value })); };
  const updateBirthDate = (value) => setForm((prev) => ({ ...prev, birthDate: value }));
  const reset = () => setForm(initialForm);

  return <div className="app-shell">
    <div className="screen-ui">
      <header className="topbar">
        <div className="brand"><div className="brand-icon"><Stethoscope size={22} /></div><div><strong>Сопроводительный лист СМП</strong><small>Электронная форма • проект Smp-sheet</small></div></div>
        <div className="actions"><button className="secondary" type="button" onClick={reset}><RotateCcw size={17} /> Очистить</button><button className="primary" type="button" onClick={() => window.print()}><Printer size={17} /> Печать</button></div>
      </header>
      <main className="workspace">
        <section className="intro"><div><p className="eyebrow">СОПРОВОДИТЕЛЬНЫЙ ЛИСТ И ТАЛОН К НЕМУ</p><h1>Заполнение листа</h1><p>Данные вводятся один раз, а печатная версия автоматически формируется в виде двух сторон А4.</p></div><div className="status"><ClipboardList size={18} /> Черновик</div></section>
        <section className="card"><div className="section-head"><span className="number">1</span><div><h2>Пациент</h2><p>Основные сведения из пунктов 1–8 оригинального бланка.</p></div></div><div className="grid three">
          <Field label="Фамилия" name="surname" value={form.surname} onChange={update}/><Field label="Имя" name="name" value={form.name} onChange={update}/><Field label="Отчество" name="patronymic" value={form.patronymic} onChange={update}/>
          <DateWheelPicker value={form.birthDate} onChange={updateBirthDate}/><Field label="Возраст, лет" name="ageYears" value={form.ageYears} onChange={update} type="number"/><Field label="Возраст, месяцев" name="ageMonths" value={form.ageMonths} onChange={update} type="number"/>
          <label className="field"><span>Пол</span><select name="sex" value={form.sex} onChange={update}><option value="">Не выбран</option><option>мужской</option><option>женский</option></select></label>
          <Field label="Серия и номер документа" name="document" value={form.document} onChange={update} wide/><Field label="Место жительства" name="address" value={form.address} onChange={update} wide/><Field label="Место оказания СМП" name="scene" value={form.scene} onChange={update} wide/>
        </div></section>
        <section className="card"><div className="section-head"><span className="number">2</span><div><h2>Состояние и помощь</h2><p>Диагноз, обстоятельства, медицинская помощь и дополнительные показатели.</p></div></div>
          <div className="vitals"><Field label="АД, мм рт. ст." name="bloodPressure" value={form.bloodPressure} onChange={update} placeholder="120/80"/><Field label="Температура, °C" name="temperature" value={form.temperature} onChange={update} placeholder="36,6"/><Field label="Глюкоза, ммоль/л" name="glucose" value={form.glucose} onChange={update} placeholder="5,4"/><Field label="LAMS, баллы" name="lams" value={form.lams} onChange={update} type="number" placeholder="0–5"/></div>
          {hasStroke && <div className="notice">Обнаружены признаки инсульта/ОНМК — перед печатью проверьте LAMS и глюкозу.</div>}
          <div className="grid two"><DiagnosisPicker value={form.diagnosis} onChange={update}/><TextField label="Обстоятельства заболевания / несчастного случая" name="circumstances" value={form.circumstances} onChange={update} rows={4}/><TextField label="Оказанная медицинская помощь" name="help" value={form.help} onChange={update} rows={5}/><Field label="Время вызова / прибытия" name="callTime" value={form.callTime} onChange={update} type="time"/></div>
        </section>
        <section className="card"><div className="section-head"><span className="number">3</span><div><h2>Доставка и передача</h2><p>Сведения о стационаре, транспортировке и бригаде.</p></div></div><div className="grid two"><Field label="Стационар / медицинская организация" name="hospital" value={form.hospital} onChange={update}/><Field label="Время доставки" name="deliveryTime" value={form.deliveryTime} onChange={update} type="time"/><Field label="Способ транспортировки" name="transport" value={form.transport} onChange={update}/><Field label="Врач / фельдшер бригады" name="brigadeDoctor" value={form.brigadeDoctor} onChange={update}/><Field label="Фельдшер / врач принимающего отделения" name="stationDoctor" value={form.stationDoctor} onChange={update}/><Field label="Состав бригады" name="team" value={form.team} onChange={update}/></div><TextField label="Примечания" name="notes" value={form.notes} onChange={update} rows={4}/></section>
        <section className="next-step"><strong>Печать</strong><span>Кнопка «Печать» формирует две страницы А4: лицевая сторона с I и II экземплярами и оборотная сторона с пунктами 14–22.</span></section>
      </main>
    </div>
    <PrintSheet form={form}/>
  </div>;
}
