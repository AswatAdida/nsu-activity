export const CAMPUS_TIME_ZONE = 'Asia/Novosibirsk'
const formatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: CAMPUS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
export function campusDateTime(instant: Date): string {
  const parts = formatter.formatToParts(instant)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}
export function parseCampusDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+07:00`)
  return Number.isFinite(date.getTime()) && campusDateTime(date) === value ? date : null
}
export const validCampusDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && parseCampusDateTime(`${value}T00:00`) !== null
export function addDays(value: string, days: number): string {
  return new Date(Date.parse(`${value}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
}
export const dayOfWeek = (value: string) => new Date(`${value}T00:00:00Z`).getUTCDay() || 7
export const weekStart = (value: string) => addDays(value, 1 - dayOfWeek(value))
export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: CAMPUS_TIME_ZONE, day: 'numeric', month: 'long' }).format(parseCampusDateTime(`${value}T12:00`)!)
}
