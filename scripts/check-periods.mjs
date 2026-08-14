/**
 * Verificacao pontual da matematica de periodo + agregacao.
 * Uso: node scripts/check-periods.mjs
 */
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

const now = new Date()
let failures = 0

function check(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`      esperado ${expected}, obtido ${actual}`)
}

// --- "ultimos 7 dias" inclui hoje => 7 dias no total ---
const u7 = { start: startOfDay(subDays(now, 6)), end: endOfDay(now) }
check(
  'ultimos7 cobre exatamente 7 dias',
  differenceInCalendarDays(u7.end, u7.start) + 1,
  7,
)

const u14 = { start: startOfDay(subDays(now, 13)), end: endOfDay(now) }
check(
  'ultimos14 cobre exatamente 14 dias',
  differenceInCalendarDays(u14.end, u14.start) + 1,
  14,
)

// --- ontem e um unico dia fechado ---
const ontem = {
  start: startOfDay(subDays(now, 1)),
  end: endOfDay(subDays(now, 1)),
}
check('ontem cobre 1 dia', differenceInCalendarDays(ontem.end, ontem.start) + 1, 1)

// --- mes passado nao invade o mes atual ---
const anterior = subMonths(now, 1)
const mesPassado = { start: startOfMonth(anterior), end: endOfMonth(anterior) }
check(
  'mes passado termina antes do inicio deste mes',
  mesPassado.end.getTime() < startOfMonth(now).getTime(),
  true,
)
check(
  'mes passado comeca no dia 1',
  format(mesPassado.start, 'dd'),
  '01',
)

// --- limites de dia sobrevivem a conversao para UTC (filtro do PostgREST) ---
const startIso = u7.start.toISOString()
const endIso = u7.end.toISOString()
check(
  'inicio ISO reconverte para a mesma meia-noite local',
  new Date(startIso).getTime(),
  u7.start.getTime(),
)
check(
  'fim ISO reconverte para o mesmo fim de dia local',
  new Date(endIso).getTime(),
  u7.end.getTime(),
)
check('fim e depois do inicio', endIso > startIso, true)

// --- serie diaria preenche TODOS os dias, inclusive zerados ---
const timestamps = [now.toISOString(), now.toISOString()]
const counts = new Map()
for (const t of timestamps) {
  const key = format(new Date(t), 'yyyy-MM-dd')
  counts.set(key, (counts.get(key) ?? 0) + 1)
}
const days = differenceInCalendarDays(u7.end, startOfDay(u7.start)) + 1
const serie = Array.from({ length: days }, (_, i) => {
  const key = format(addDays(startOfDay(u7.start), i), 'yyyy-MM-dd')
  return counts.get(key) ?? 0
})
check('serie diaria tem 1 ponto por dia', serie.length, 7)
check(
  'serie diaria soma os registros do periodo',
  serie.reduce((a, b) => a + b, 0),
  2,
)
check('hoje e o ultimo ponto da serie', serie[serie.length - 1], 2)

// --- ordem dos dias da semana Seg..Dom ---
const ORDER = [1, 2, 3, 4, 5, 6, 0]
const LABELS = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 0: 'Dom' }
check(
  'eixo do grafico semanal comeca na segunda e termina no domingo',
  ORDER.map((d) => LABELS[d]).join(','),
  'Seg,Ter,Qua,Qui,Sex,Sáb,Dom',
)

console.log(
  failures === 0
    ? '\nTodas as verificacoes passaram.'
    : `\n${failures} verificacao(oes) falharam.`,
)
process.exit(failures === 0 ? 0 : 1)
