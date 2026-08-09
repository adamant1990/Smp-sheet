import React from 'react';

const Line = ({ children = '' }) => <div className="print-line">{children}</div>;
const value = (text, fallback = '________________') => text || fallback;

function Header({ copy }) {
  return <>
    <div className="print-org">
      <div>Медицинская документация</div><div>Учетная форма № 114/у</div>
      <div>Утверждена приказом Минздрава Российской Федерации</div>
      <div>от 02 декабря 2009 г. № 942 &nbsp; Приложение № 4</div>
    </div>
    <div className="print-title">СОПРОВОДИТЕЛЬНЫЙ ЛИСТ И ТАЛОН К НЕМУ</div>
    <div className="print-copy-title">{copy}. СОПРОВОДИТЕЛЬНЫЙ ЛИСТ № ______</div>
    <div className="print-copy-subtitle">Станции (отделения) скорой медицинской помощи</div>
  </>;
}

function Patient({ form }) {
  const birthDate = form.birthDate ? form.birthDate.split('-').reverse().join('.') : '____.__.____';
  return <div className="print-patient">
    <Line><b>1. Фамилия</b> {value(form.surname)}</Line>
    <Line><b>2. Имя</b> {value(form.name)} <span className="date-inline">дата рождения «{birthDate}»</span></Line>
    <Line><b>3. Отчество</b> {value(form.patronymic)}</Line>
    <Line><b>4. Возраст</b> {value(form.ageYears, '___')} лет &nbsp; {value(form.ageMonths, '___')} месяцев</Line>
    <Line><b>5. Пол:</b> {form.sex || 'мужской - 1, женский - 2'}</Line>
    <Line><b>6. Серия и номер документа, удостоверяющего личность:</b> {value(form.document)}</Line>
    <Line><b>7. Место жительства</b> {value(form.address)}</Line>
    <Line><b>8. Место оказания скорой медицинской помощи:</b> {value(form.scene)}</Line>
  </div>;
}

function Vitals({ form }) {
  return <div className="print-vitals">
    <span><b>АД</b> {value(form.bloodPressure, '____/____')} мм рт. ст.</span>
    <span><b>Температура</b> {value(form.temperature, '____')} °C</span>
    <span><b>Глюкоза</b> {value(form.glucose, '____')} ммоль/л</span>
    <span><b>LAMS</b> {value(form.lams, '____')} бал.</span>
  </div>;
}

function FirstCopy({ form }) {
  return <section className="front-copy">
    <Header copy="I" /><Vitals form={form} /><Patient form={form} />
    <div className="print-block diagnosis-block"><b>9. Диагноз врача (фельдшера) бригады скорой медицинской помощи</b><div className="print-writing diagnosis-lines">{form.diagnosis}</div><div className="direction">Направление врача поликлиники, др. мед. организации (нужное подчеркнуть)</div></div>
    <div className="print-block compact"><b>10. Доставлен в л/п стационара № ГБ № 1</b> {form.hospital || '________________'}<br/>«{form.deliveryTime || '____'}» час «____» мин. «____» 20___ г.</div>
    <div className="print-block signature-row"><b>11. Врач (фельдшер)</b> {form.brigadeDoctor || '________________________'} <span>________________ (подпись)</span> <span>________________ (ф. и. о.)</span></div>
  </section>;
}

function SecondCopy({ form }) {
  return <section className="front-copy">
    <Header copy="II" /><Vitals form={form} /><Patient form={form} />
    <div className="print-block diagnosis-block"><b>9. Обстоятельства заболевания / несчастного случая (указать)</b><div className="print-writing diagnosis-lines">{form.circumstances}</div><div className="time-line">«{form.callTime || '____'}» час «____» мин. «____» 20___ г.</div></div>
    <div className="print-block"><b>10. Оказана медицинская помощь</b><div className="print-writing help-lines">{form.help}</div></div>
    <div className="print-block compact"><b>11. Способ транспортировки:</b> {form.transport || 'на носилках, на руках, пешком (нужное подчеркнуть)'}</div>
    <div className="print-block compact"><b>12. Доставлен в л/п стационара № ГБ № 1</b> {form.hospital || '________________'}<br/>«{form.deliveryTime || '____'}» час «____» мин. «____» 20___ г.</div>
    <div className="print-block signature-row"><b>13. Врач (фельдшер)</b> {form.brigadeDoctor || '________________________'} <span>________________ (подпись)</span> <span>________________ (ф. и. о.)</span></div>
  </section>;
}

export function FrontSheet({ form }) {
  return <div className="print-page front-page"><FirstCopy form={form} /><SecondCopy form={form} /></div>;
}

export function BackSheet({ form }) {
  return <div className="print-page back-page">
    <div className="back-main">
      <div className="print-block back-item item-14"><b>14. Диагноз врача (фельдшера) скорой медицинской помощи, отделения (пункта) неотложной помощи, поликлиники (нужное подчеркнуть)</b><div className="print-writing back-lines">{form.diagnosis}</div></div>
      <div className="print-block back-item item-15"><b>15. Диагноз врача приемного отделения</b><div className="print-writing back-lines"></div></div>
      <div className="print-block back-item item-16"><b>16. Заключительный клинический диагноз (патологоанатомическое заключение)</b><div className="print-writing back-lines"></div></div>
      <div className="back-grid-row"><div className="print-block compact"><b>17. Операция</b> «____» час «____» мин. «____» 20___ г.<br/>Наименование операции ________________________________</div><div className="print-block compact"><b>18. Провел в стационаре</b> ______ дней ______ час.</div></div>
      <div className="print-block compact"><b>19. Оказана помощь амбулаторно</b> ________________________________</div>
      <div className="print-block compact"><b>20. Больной выписан:</b> 1-здоровым, 2-улучшение, 3-без улучшения, 4-ухудшение, 5-умер (нужное подчеркнуть). «____» __________ 20___ г.</div>
      <div className="print-block compact"><b>21. Дата выписки больного из стационара</b> «____» __________ 20___ г.</div>
      <div className="print-block back-item item-22"><b>22. Замечания мед. организации к работе бригады скорой медицинской помощи</b><div className="print-writing back-lines"></div></div>
      <div className="print-sign">Заведующий отделением (врач отделения) ____________________________ (ф. и. о., подпись)</div>
    </div>
    <aside className="back-notes">
      <p className="notes-intro"><b>В случае необходимости получения дополнительных сведений следует звонить на станцию (отделение) скорой медицинской помощи больному, связанные с транспортировкой и оказанием медицинской помощи.</b></p>
      <div className="notes-label">Прочие замечания:</div><div className="print-writing notes-lines">{form.notes}</div>
      <div className="notes-label">Причины замечания:</div><div className="print-writing notes-lines"></div>
    </aside>
  </div>;
}

export default function PrintSheet({ form }) {
  return <div className="print-root"><FrontSheet form={form} /><BackSheet form={form} /></div>;
}
