import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { List, ClipboardList, FileText } from 'lucide-react';
import { NUMBERED_STEP_REGEX, NUMBERED_STEP_STRIP_REGEX, esTituloReceta, formatearReceta, getTituloIcon } from './recipeFormatter';

describe('formatearReceta', () => {
  it('returns null for null or empty input', () => {
    expect(formatearReceta(null)).toBeNull();
    expect(formatearReceta('')).toBeNull();
    expect(formatearReceta(undefined)).toBeNull();
  });

  it('renders a bullet list', () => {
    const { container } = render(<div>{formatearReceta('- harina\n- azúcar')}</div>);
    const ul = container.querySelector('.lista-ingredientes');
    expect(ul).not.toBeNull();
    const items = screen.getAllByText(/harina|azúcar/);
    expect(items).toHaveLength(2);
    expect(ul.firstChild.textContent).toContain('harina');
  });

  it('renders numbered steps', () => {
    const { container } = render(<div>{formatearReceta('1. Mezclar\n2. Hornear')}</div>);
    const pasos = container.querySelectorAll('.paso-preparacion');
    expect(pasos).toHaveLength(2);
    expect(screen.getByText('Mezclar')).not.toBeNull();
    expect(screen.getByText('Hornear')).not.toBeNull();
    expect(container.querySelector('.paso-numero').textContent).toBe('1');
  });

  it('renders a section header without asterisks or colon', () => {
    const { container } = render(<div>{formatearReceta('Ingredientes:')}</div>);
    expect(screen.getByText('Ingredientes')).not.toBeNull();
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3.querySelector('svg')).not.toBeNull();
  });

  it('renders a bold markdown header', () => {
    render(<div>{formatearReceta('**Preparación:**')}</div>);
    expect(screen.getByText('Preparación')).not.toBeNull();
  });

  it('strips the "nombre de la receta" prefix and hides the icon', () => {
    const { container } = render(<div>{formatearReceta('**Nombre de la receta: Tarta de manzana**')}</div>);
    expect(screen.getByText('Tarta de manzana')).not.toBeNull();
    const h3 = container.querySelector('h3');
    expect(h3.querySelector('svg')).toBeNull();
  });

  it('renders an info box for Tiempo lines', () => {
    const { container } = render(<div>{formatearReceta('Tiempo total: 45 minutos')}</div>);
    const info = container.querySelector('.info-destacada');
    expect(info).not.toBeNull();
    expect(screen.getByText('Tiempo total: 45 minutos')).not.toBeNull();
    expect(info.querySelector('svg')).not.toBeNull();
  });

  it('renders a plain paragraph', () => {
    render(<div>{formatearReceta('Una receta deliciosa y fácil.')}</div>);
    const p = screen.getByText('Una receta deliciosa y fácil.');
    expect(p.tagName).toBe('P');
  });

  it('flushes open lists and adds a spacer on empty lines', () => {
    const { container } = render(<div>{formatearReceta('- harina\n\n- azúcar')}</div>);
    const uls = container.querySelectorAll('.lista-ingredientes');
    expect(uls).toHaveLength(2);
    const spacers = container.querySelectorAll('.mb-3');
    expect(spacers.length).toBeGreaterThan(0);
    const liCounts = [...uls].map((ul) => ul.querySelectorAll('li').length);
    expect(liCounts).toEqual([1, 1]);
  });

  it('flushes numbered steps before a header', () => {
    const { container } = render(<div>{formatearReceta('1. Mezclar\n\nPreparación:')}</div>);
    const pasos = container.querySelectorAll('.paso-preparacion');
    expect(pasos).toHaveLength(1);
  });

  it('renders final list and steps with ul-final / pasos-final keys', () => {
    const { container } = render(<div>{formatearReceta('1. Mezclar\n- harina')}</div>);
    const uls = container.querySelectorAll('.lista-ingredientes');
    expect(uls).toHaveLength(1);
    const pasos = container.querySelectorAll('.paso-preparacion');
    expect(pasos).toHaveLength(1);
    expect(uls[0].querySelectorAll('li')).toHaveLength(1);
    expect(container.querySelector('div.space-y-3.ml-2')).not.toBeNull();
  });
});

describe('getTituloIcon', () => {
  it('maps ingredientes to List', () => {
    const icon = getTituloIcon('Ingredientes');
    expect(icon.type).toBe(List);
  });

  it('maps preparación to ClipboardList', () => {
    expect(getTituloIcon('Preparación').type).toBe(ClipboardList);
  });

  it('returns null for nombre', () => {
    expect(getTituloIcon('Nombre de la receta')).toBeNull();
  });

  it('returns FileText for unknown titles', () => {
    expect(getTituloIcon('Otro título').type).toBe(FileText);
  });
});

describe('NUMBERED_STEP_REGEX', () => {
  it('detects numbered steps', () => {
    expect(NUMBERED_STEP_REGEX.test('1. Mezclar')).toBe(true);
    expect(NUMBERED_STEP_REGEX.test('- harina')).toBe(false);
  });

  it('strips the number prefix', () => {
    expect('1. Mezclar'.replace(NUMBERED_STEP_STRIP_REGEX, '')).toBe('Mezclar');
    expect('12. Hornear'.replace(NUMBERED_STEP_STRIP_REGEX, '')).toBe('Hornear');
  });
});

describe('esTituloReceta', () => {
  it('returns true for known keyword titles', () => {
    expect(esTituloReceta('Ingredientes')).toBe(true);
    expect(esTituloReceta('Preparación')).toBe(true);
    expect(esTituloReceta('Nombre de la receta')).toBe(true);
  });

  it('returns false for plain text lines', () => {
    expect(esTituloReceta('Mezclar la harina con el azúcar')).toBe(false);
  });

  it('returns false for lines over 50 characters', () => {
    expect(esTituloReceta('ingredientes ' + 'x'.repeat(50))).toBe(false);
  });

  it('returns true for lines under 50 characters', () => {
    expect(esTituloReceta('Ingredientes' + 'x'.repeat(35))).toBe(true);
  });
});
