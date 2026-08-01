const PADRAO_DATA_SEM_HORARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Interpreta YYYY-MM-DD como uma data do calendário local, sem conversão UTC. */
export function interpretarDataLocal(valor: string): Date {
  const partes = PADRAO_DATA_SEM_HORARIO.exec(valor);
  if (!partes) return new Date(valor);

  const [, ano, mes, dia] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

/** Gera YYYY-MM-DD usando o calendário local do dispositivo. */
export function formatarDataLocalISO(data: Date): string {
  const ano = String(data.getFullYear()).padStart(4, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
