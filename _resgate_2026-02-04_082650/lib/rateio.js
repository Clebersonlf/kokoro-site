export function calcularSplit(valor, pctProfessor, pctTitular) {
  const v = Number(valor ?? 0);
  const a = Number(pctProfessor ?? 0);
  const b = Number(pctTitular   ?? 0);

  if ([v,a,b].some(n => Number.isNaN(n))) {
    throw new Error('Valores inválidos: use números (aceitam decimais)');
  }
  if (a < 0 || a > 100 || b < 0 || b > 100) {
    throw new Error('Percentuais devem estar entre 0 e 100');
  }
  // Tolerância de soma (até 0,01)
  const EPS = 0.01;
  if (Math.abs((a + b) - 100) > EPS) {
    throw new Error('Percentuais devem somar 100 (tolerância 0,01)');
  }

  const val = Number(v.toFixed(2));
  const parte_professor = Number(((val * a) / 100).toFixed(2));
  const parte_titular   = Number(((val * b) / 100).toFixed(2));

  return { parte_professor, parte_titular };
}
