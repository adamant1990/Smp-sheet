import React from 'react';

const Line = ({ children = '' }) => <div className="print-line">{children}</div>;

function Header({ copy }) {
  return <>
    <div className="print-org">
      <div>Медицинская документация</div><div>Учетная форма № 114/у</div>
      <div>Утверждена приказом Минздрава Российской Федерации</div>
      <div>от 02 декабря 2009 г. № 942 &nbsp; Приложение № 4</div>
    </div>
    <div className="print-title">СОПРОВОДИТЕЛЬНЫЙ ЛИСТ И ТАЛОН К НЕМУ</div>
    <div className="print-subtitle">{copy}. Сопроводительный лист № ______</div>
    <div className="print-subtitle">Станции (отделения) скорой медицинской помощи</div>
  </>;
}

function Patient({ form }) {
  return <div className="print-patient">
    <Line><b>1. Фамилия</b> {form.surname}</Line>
    <Line><b>2. Имя</b> {form.name} &nbsp;&nbsp; дата рождения «____» __________ ____ г.</Line>
    <Line><b>3. Отчество</b> {form.patronymic}</Line>
    <Line><b>4. Возраст</b> {form.ageYears || '___'} лет &nbsp;&nbsp; {form.ageMonths || '___'} месяцев</Line>
    <Line><b>5. Пол:</b> {form.sex || 'мужской / женский'}</Line>
    <Line><b>6. Серия и номер документа, удостоверяющего личность:</b> {form.document}</Line>
    <Line><b>7. Место жительства</b> {form.address}</Line>
    <Line><b>8. Место оказания скорой медицинской помощи:</b> {form.scene}</Line>
  </div>;
}

export function FrontSheet({ form }) {
  return <div className="print-page front-page">
    <Header copy="I" />
    <div className="print-meta"><b>АД</b> {form.bloodPressure || '____/____'} мм рт. ст. &nbsp;&nbsp; <b>Температура</b> {form.temperature || '____'} °C &nbsp;&nbsp; <b>Глюкоза</b> {form.glucose || '____'} ммоль/л &nbsp;&nbsp; <b>LAMS</b> {form.lams || '____'} бал.</div>
    <Patient form={form} />
    <div className="print-block"><b>9. Диагноз врача (фельдшера) бригады скорой медицинской помощи:</b><div className="print-writing">{form.diagnosis}</div></div>
    <div className="print-block compact"><b>10. Доставлен в л/п стационара № ГБ № 1</b> {form.hospital} &nbsp; «____» час «____» мин. «____» 20___ г.</div>
    <div className="print-block"><b>11. Врач (фельдшер)</b> {form.brigadeDoctor} ____________________ (подпись) ____________________ (ф. и. о.)</div>
    <div className="print-copy-break" />
    <Header copy="II" />
    <div className="print-meta"><b>АД</b> {form.bloodPressure || '____/____'} мм рт. ст. &nbsp;&nbsp; <b>Температура</b> {form.temperature || '____'} °C &nbsp;&nbsp; <b>Глюкоза</b> {form.glucose || '____'} ммоль/л &nbsp;&nbsp; <b>LAMS</b> {form.lams || '____'} бал.</div>
    <Patient form={form} />
    <div className="print-block"><b>9. Обстоятельства заболевания / несчастного случая (указать)</b><div className="print-writing">{form.circumstances}</div></div>
    <div className="print-block"><b>10. Оказана медицинская помощь</b><div className="print-writing">{form.help}</div></div>
    <div className="print-block compact"><b>11. Способ транспортировки:</b> {form.transport || 'на носилках / на руках / пешком (нужное подчеркнуть)'}</div>
    <div className="print-block compact"><b>12. Доставлен в л/п стационара № ГБ № 1</b> {form.hospital} &nbsp; «____» час «____» мин. «____» 20___ г.</div>
    <div className="print-block"><b>13. Врач (фельдшер)</b> {form.brigadeDoctor} ____________________ (подпись) ____________________ (ф. и. о.)</div>
  </div>;
}

export function BackSheet({ form }) {
  return <div className="print-page back-page">
    <div className="print-back-column">
      <div className="print-block"><b>14. Диагноз врача (фельдшера) скорой медицинской помощи, отделения (пункта) неотложной помощи, поликлиники</b><div className="print-writing tall">{form.diagnosis}</div></div>
      <div className="print-block"><b>15. Диагноз врача приемного отделения</b><div className="print-writing tall"></div></div>
      <div className="print-block"><b>16. Заключительный клинический диагноз (патологоанатомическое заключение)</b><div className="print-writing tall"></div></div>
      <div className="print-block compact"><b>17. Операция</b> «____» час «____» мин. «____» 20___ г.<br/>Наименование операции ______________________________________________</div>
      <div className="print-block compact"><b>18. Провел в стационаре</b> ______ дней ______ час.</div>
      <div className="print-block"><b>19. Оказана помощь амбулаторно</b><div className="print-writing"></div></div>
      <div className="print-block compact"><b>20. Больной выписан:</b> 1 — здоровым, 2 — улучшение, 3 — без улучшения, 4 — ухудшение, 5 — умер (нужное подчеркнуть).<br/>«____» __________ 20___ г.</div>
      <div className="print-block"><b>21. Дата выписки больного из стационара</b> «____» __________ 20___ г.</div>
      <div className="print-block"><b>22. Замечания мед. организации к работе бригады скорой медицинской помощи</b><div className="print-writing tall"></div></div>
      <div className="print-sign">Заведующий отделением (врач отделения) __________________________ (ф. и. о., подпись)</div>
    </div>
    <div className="print-back-column right-notes">
      <p><b>В случае необходимости получения дополнительных сведений следует звонить на станцию (отделение) скорой медицинской помощи.</b></p>
      <p>Особенности, связанные с транспортировкой и оказанием медицинской помощи больному:</p>
      <div className="print-writing huge">{form.notes}</div>
      <p><b>Прочие замечания:</b></p><div className="print-writing huge"></div>
    </div>
  </div>;
}

export default function PrintSheet({ form }) {
  return <div className="print-root"><FrontSheet form={form} /><BackSheet form={form} /></div>;
}
