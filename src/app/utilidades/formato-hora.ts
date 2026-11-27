export function formatearHora(hora: number): string {
  const hora12 = hora % 12 || 12;
  const periodo = hora < 12 ? 'a. m.' : 'p. m.';
  return `${hora12}:00 ${periodo}`;
}
