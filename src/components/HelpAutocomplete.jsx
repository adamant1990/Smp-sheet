import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_DIRECTIONS = ['внутримышечно', 'внутривенно', 'подкожно', 'сублингвально'];
const norm = value => String(value || '').toLowerCase().replace(/ё/g, 'е').trim();

// Русские поисковые названия связаны с существующими латинскими записями.
// В справочник и в Supabase эти синонимы не записываются: в карту подставляется
// только исходное официальное название из поля drugs.name.
const DRUG_ALIASES = {
  'magnesii sulfatis': ['магний', 'магн', 'магния', 'сульфат магния', 'магнезия'],
  'kalii et magnesii asparaginatis': ['панангин', 'аспаркам', 'калия и магния аспарагинат'],
  'natrii chloridi': ['натрий хлорид', 'натрия хлорид', 'физраствор', 'физиологический раствор', 'натрия хлорида'],
  'dextrosi': ['глюкоза', 'декстроза'],
  'kalii chloridi': ['калий хлорид', 'хлорид калия', 'калия хлорид'],
  'natrii hydrocarbonatis': ['гидрокарбонат натрия', 'сода', 'натрия гидрокарбонат'],
  'clonidini': ['клофелин', 'клонидин'],
  'nifedipini': ['нифедипин', 'коринфар'],
  'captoprili': ['каптоприл', 'капотен'],
  'insulini asparti': ['инсулин аспарт', 'аспарт'],
  'hydrocortisoni': ['гидрокортизон'],
  'dexamethasoni': ['дексаметазон'],
  'oxytocini': ['окситоцин'],
  'prednisoloni': ['преднизолон'],
  'furosemidi': ['фуросемид', 'лазикс'],
  'morphini': ['морфин'],
  'trimeperidini': ['промедол', 'тримеперидин'],
  'fentanyli': ['фентанил'],
  'tramadoli': ['трамадол'],
  'ketorolaci': ['кеторолак', 'кеторол'],
  'paracetamoli': ['парацетамол'],
  'ketoprofeni': ['кетопрофен', 'кетонал'],
  'chlorpromazini': ['аминазин', 'хлорпромазин'],
  'droperidoli': ['дроперидол'],
  'midazolami': ['мидазолам'],
  'naloxoni': ['налоксон'],
  'diazepami': ['диазепам', 'реланиум'],
  'digoxini': ['дигоксин'],
  'drotaverini': ['дротаверин', 'но-шпа'],
  'acidi acetylsalicylici': ['ацетилсалициловая кислота', 'аспирин', 'ацетилсалицилат'],
  'heparini natrii': ['гепарин'],
  'clopidogreli': ['клопидогрел', 'плавикс'],
  'etamsylati': ['этамзилат', 'дицинон'],
  'ketamini': ['кетамин'],
  'propofoli': ['пропофол'],
  'alteplasi': ['алтеплаза', 'актилизе'],
  'citicolini': ['цитиколин', 'цераксон'],
  'glycini': ['глицин'],
  'metoclopramidi': ['метоклопрамид', 'церукал'],
  'ondansetroni': ['ондансетрон', 'зофран'],
  'ciprofloxacini': ['ципрофлоксацин'],
  'ceftriaxoni': ['цефтриаксон'],
  'amoxicillini': ['амоксициллин'],
  'aquae pro injectionibus': ['вода для инъекций', 'вода для инъекций'],
  'procaini': ['прокаин', 'новокаин'],
  'suxamethonii chloridi et iodidi': ['суксаметоний', 'листенон'],
  'pipecuronii bromidi': ['пипекуроний'],
  'ethylmethylhydroxypyridini succinatis': ['этилметилгидроксипиридина сукцинат', 'мексидол'],
  'acidi aminocapronici': ['аминокапроновая кислота'],
  'natrii thiosulfatis': ['тиосульфат натрия', 'натрия тиосульфат'],
  'prot amini sulfatis': ['протамина сульфат', 'протамин'],
};

const aliasesFor = name => {
  const key = norm(name);
  const found = Object.entries(DRUG_ALIASES).find(([latin]) => key.includes(norm(latin)));
  return found ? found[1] : [];
};

const suggestDirections = query => {
  const q = norm(query);
  return q ? DEFAULT_DIRECTIONS.filter(item => norm(item).includes(q)) : [];
};

export default function HelpAutocomplete({ value, onChange }) {
  const [data, setData] = useState({ drugs: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const { data: drugs, error } = await supabase.from('drugs').select('id,name').order('name');
      if (!cancelled && !error) setData({ drugs: drugs || [] });
    };
    refresh();
    window.addEventListener('smp-directories-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('smp-directories-updated', refresh);
    };
  }, []);

  const text = String(value || '');
  const currentToken = useMemo(() => {
    const match = text.match(/(^|[\s,;])([^\s,;]*)$/);
    return match ? match[2] : '';
  }, [text]);
  const query = norm(currentToken);
  const directions = useMemo(() => suggestDirections(currentToken), [currentToken]);
  const drugs = useMemo(() => {
    if (!query || directions.length) return [];
    return data.drugs
      .filter(item => norm(item.name).includes(query) || aliasesFor(item.name).some(alias => norm(alias).includes(query)))
      .slice(0, 8);
  }, [data, query, directions.length]);
  const results = directions.length
    ? directions.map(label => ({ type: 'route', label }))
    : drugs.map(item => ({ type: 'drug', ...item, label: item.name }));

  const replaceCurrentToken = replacement => {
    const match = text.match(/(^|[\s,;])([^\s,;]*)$/);
    if (!match) return `${text}${replacement}`;
    return `${text.slice(0, text.length - match[2].length)}${replacement}`;
  };

  const choose = item => {
    const replacement = `${item.label} `;
    onChange(replaceCurrentToken(replacement));
    setOpen(false);
    setActive(0);
  };

  const handleKeyDown = event => {
    if (!open || !results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (event.key === 'Enter' && results[active]) { event.preventDefault(); choose(results[active]); }
    else if (event.key === 'Escape') setOpen(false);
  };

  return <div className="help-autocomplete">
    <textarea
      rows={6}
      name="help"
      value={text}
      onChange={event => { onChange(event.target.value); setOpen(true); setActive(0); }}
      onFocus={() => setOpen(true)}
      onKeyDown={handleKeyDown}
      onBlur={() => setTimeout(() => setOpen(false), 180)}
      placeholder="Например: магн... / Magn... или внут..."
      autoComplete="off"
      spellCheck="false"
    />
    {open && results.length > 0 && <div className="quick-results help-results">
      {results.map((item, index) => <button key={`${item.type}-${item.id || item.label}`} type="button" className={index === active ? 'active' : ''} onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}>
        <strong>{item.label}</strong>
        {item.type === 'route' && <span>Путь введения</span>}
      </button>)}
    </div>}
  </div>;
}
