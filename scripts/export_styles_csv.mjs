import fs from 'fs';

const styles = JSON.parse(fs.readFileSync('./src/data/styles.json', 'utf8'));

const headers = [
  'Estilo / Classificação',
  'Açúcares (%)',
  'Gordura (%)',
  'SLNG (%)',
  'Outros Sólidos (%)',
  'Sólidos Totais (%)',
  'Água (%)',
  'PAC (Anticongelante)',
  'POD (Dulçor)',
  'Divisor PAC',
  'Proteína (%)'
];

const rows = [headers];

for (const [key, s] of Object.entries(styles)) {
  const p = (v) => (v * 100).toFixed(1).replace('.', ',') + '%';
  const range = (min, max) => (min === max ? p(min) : `${p(min)} a ${p(max)}`);
  const rangeNum = (min, max) => (min === max ? String(min) : `${min} a ${max}`);

  rows.push([
    s.name || key,
    range(s.min.sugars, s.max.sugars),
    range(s.min.fat, s.max.fat),
    range(s.min.msnf, s.max.msnf),
    range(s.min.otherSolids, s.max.otherSolids),
    range(s.min.totalSolids, s.max.totalSolids),
    range(s.min.water, s.max.water),
    rangeNum(s.min.pac, s.max.pac),
    rangeNum(s.min.pod, s.max.pod),
    String(s.pacDivisor),
    s.min.protein > 0 || s.max.protein > 0 ? range(s.min.protein, s.max.protein) : '-'
  ]);
}

const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(';')).join('\r\n');
fs.writeFileSync('./parametros_estilos_gelato.csv', csv, 'utf8');
console.log('Arquivo parametros_estilos_gelato.csv gerado com sucesso!');

