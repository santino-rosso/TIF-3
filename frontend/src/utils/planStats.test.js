import { describe, expect, it } from 'vitest';
import { calcularPorcentajeUso, colorNivelUso } from './planStats';

describe('calcularPorcentajeUso', () => {
  it('computes the usage percentage', () => {
    expect(calcularPorcentajeUso({ generaciones_usadas: 3, limite_generaciones: 5 })).toBe(60);
    expect(calcularPorcentajeUso({ generaciones_usadas: 2, limite_generaciones: 5 })).toBe(40);
  });

  it('clamps the percentage at 100', () => {
    expect(calcularPorcentajeUso({ generaciones_usadas: 5, limite_generaciones: 5 })).toBe(100);
    expect(calcularPorcentajeUso({ generaciones_usadas: 150, limite_generaciones: 100 })).toBe(100);
  });

  it('returns 0 when the limit is zero or missing', () => {
    expect(calcularPorcentajeUso({ generaciones_usadas: 0, limite_generaciones: 0 })).toBe(0);
    expect(calcularPorcentajeUso({ generaciones_usadas: 4, limite_generaciones: 0 })).toBe(0);
    expect(calcularPorcentajeUso({ generaciones_usadas: 4 })).toBe(0);
  });
});

describe('colorNivelUso', () => {
  it('returns red at 90% or more', () => {
    expect(colorNivelUso(90)).toBe('bg-red-500');
    expect(colorNivelUso(95)).toBe('bg-red-500');
    expect(colorNivelUso(100)).toBe('bg-red-500');
  });

  it('returns yellow from 70% to 89%', () => {
    expect(colorNivelUso(89)).toBe('bg-yellow-500');
    expect(colorNivelUso(70)).toBe('bg-yellow-500');
  });

  it('returns green below 70%', () => {
    expect(colorNivelUso(69)).toBe('bg-green-500');
    expect(colorNivelUso(0)).toBe('bg-green-500');
  });
});