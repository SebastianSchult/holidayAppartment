export function formatLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function eachNight(startISO: string, endISO: string): string[] {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const dates: string[] = [];

  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    dates.push(formatLocalISO(date));
  }

  return dates;
}
