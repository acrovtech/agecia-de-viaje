import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { analyzeSeo } from '../components/forms/shared/seo-analysis';
import { SETTINGS_NAV_ITEMS, getSettingsConfigByPath } from './settings-navigation';

describe('Product IA Lock & Core Product Simplification (P2.8 Commit B)', () => {
  // ---------------------------------------------------------------------------
  // 1. FINAL V1 MAIN NAVIGATION (B1, B2, B3)
  // ---------------------------------------------------------------------------
  it('1. sidebar contains exactly the 4 core navigation items plus bottom surfaces', () => {
    const sidebarPath = path.resolve(__dirname, '../components/design-system/sidebar.tsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    // Extract mainNavItems labels
    expect(content).toContain("label: 'Inicio'");
    expect(content).toContain("label: 'Reservas'");
    expect(content).toContain("label: 'Tours'");
    expect(content).toContain("label: 'Reportes'");

    // Must NOT contain dormant modules in active sidebar
    expect(content).not.toContain("label: 'Operaciones'");
    expect(content).not.toContain("label: 'Traslados'");
    expect(content).not.toContain("label: 'Equipo',");
    expect(content).not.toContain("label: 'Personal operativo'");
    expect(content).not.toContain("label: 'Flota operativa'");
    expect(content).not.toContain("label: 'Vehículos comerciales'");
  });

  it('2. team is accessible as a first-class section inside Settings', () => {
    const teamConfig = getSettingsConfigByPath('/settings/team');
    expect(teamConfig.id).toBe('team');
    expect(teamConfig.groupId).toBe('account');
    expect(teamConfig.href).toBe('/settings/team');

    // Canonical /team page redirects to /settings/team
    const teamPagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/team/page.tsx');
    const teamContent = fs.readFileSync(teamPagePath, 'utf8');
    expect(teamContent).toContain("redirect(`/settings/team");
  });

  it('3. feedback (Ayuda y comentarios) is accessible inside Settings and Account menu', () => {
    const feedbackConfig = getSettingsConfigByPath('/settings/feedback');
    expect(feedbackConfig.id).toBe('feedback');
    expect(feedbackConfig.groupId).toBe('account');
    expect(feedbackConfig.href).toBe('/settings/feedback');

    const cardPath = path.resolve(__dirname, '../components/design-system/tenant-account-card.tsx');
    const cardContent = fs.readFileSync(cardPath, 'utf8');
    expect(cardContent).toContain('href="/settings/feedback"');
  });

  // ---------------------------------------------------------------------------
  // 2. DORMANT NON-CORE CAPABILITIES (B4, B5)
  // ---------------------------------------------------------------------------
  it('4. former active operations and transfer routes render a controlled dormant notice', () => {
    const dormantRoutes = [
      '../app/(authenticated)/(workspace)/catalog/transfers/page.tsx',
      '../app/(authenticated)/(workspace)/operations/page.tsx',
      '../app/(authenticated)/(workspace)/resources/fleet/page.tsx',
      '../app/(authenticated)/(workspace)/resources/personnel/page.tsx',
      '../app/(authenticated)/(workspace)/resources/vehicles/page.tsx',
    ];

    for (const relativePath of dormantRoutes) {
      const fullPath = path.resolve(__dirname, relativePath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      expect(fileContent).toContain('DormantFeatureNotice');
    }
  });

  it('5. transfer selection is removed from canonical "Nueva reserva" manual flow', () => {
    const reservationsPath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/reservations/page.tsx');
    const content = fs.readFileSync(reservationsPath, 'utf8');

    // When params.new === '1', kind is fixed to tours and no transfer tabs are rendered
    expect(content).toContain("const kind = 'tours';");
    expect(content).not.toContain('href="/reservations?new=1&kind=transfers"');
  });

  // ---------------------------------------------------------------------------
  // 3. ACTION-ORIENTED HOME (B9)
  // ---------------------------------------------------------------------------
  it('6. dashboard/inicio is refocused on action-oriented operational metrics without dispatch missing metrics', () => {
    const dashboardViewPath = path.resolve(__dirname, '../components/workspace/views/dashboard-view.tsx');
    const viewContent = fs.readFileSync(dashboardViewPath, 'utf8');

    expect(viewContent).toContain('Requieren Atención');
    expect(viewContent).toContain('Carga de los Próximos 7 Días');
    expect(viewContent).toContain('Próximas Reservas');

    expect(viewContent).not.toContain('dispatchIncomplete');
    expect(viewContent).not.toContain('Falta asignar recursos');
    expect(viewContent).not.toContain('guides missing');
  });

  // ---------------------------------------------------------------------------
  // 4. REPORTS MODULE TRUTH (B8)
  // ---------------------------------------------------------------------------
  it('7. reports page is registered in canonical workspace and proxy routes', () => {
    const reportsPagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/reports/page.tsx');
    expect(fs.existsSync(reportsPagePath)).toBe(true);

    const proxyPath = path.resolve(__dirname, '../proxy.ts');
    const proxyContent = fs.readFileSync(proxyPath, 'utf8');
    expect(proxyContent).toContain("pathname === '/reports'");
  });

  // ---------------------------------------------------------------------------
  // 5. DETERMINISTIC SEO RULES ENGINE (B18, B19, B20, B21)
  // ---------------------------------------------------------------------------
  it('8. analyzeSeo performs rich deterministic evaluation without mutating tour data', () => {
    const result = analyzeSeo({
      title: 'Tour Machu Picchu Full Day Clásico',
      metaTitle: 'Tour Machu Picchu Full Day - Reserva Oficial',
      metaDescription: 'Descubre la magia de Machu Picchu en un tour exclusivo con guía experto, traslados y tren panorámico incluido.',
      slug: 'tour-machu-picchu-full-day',
      focusKeyphrase: 'Machu Picchu Full Day',
      description: 'Un recorrido completo y detallado por una de las maravillas del mundo moderno. Incluye traslados desde Cusco, tren hacia Aguas Calientes y guiado profesional dentro del complejo arqueológico.',
      itinerariesCount: 2,
      faqsCount: 3,
      imagesWithAltCount: 2,
      totalImagesCount: 2,
    });

    expect(result.label).toBe('Diagnóstico SEO');
    expect(result.level).toBe('Excelente');
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.results.length).toBeGreaterThanOrEqual(5);

    // Verify keyphrase detected in title, metaDescription, and slug
    const goodResults = result.results.filter((r) => r.type === 'good').map((r) => r.text);
    expect(goodResults.some((t) => t.includes('Frase clave encontrada') || t.includes('Frase clave aparece') || t.includes('Frase clave definida'))).toBe(true);
  });

  it('9. analyzeSeo flags missing keyphrase and brief descriptions truthfully', () => {
    const result = analyzeSeo({
      title: 'Tour',
      description: 'Breve',
      slug: 'tour',
    });

    expect(result.level).toBe('Requiere atención');
    expect(result.score).toBeLessThan(45);
    const badResults = result.results.filter((r) => r.type === 'bad' || r.type === 'warning').map((r) => r.text);
    expect(badResults.some((t) => t.includes('frase clave'))).toBe(true);
    expect(badResults.some((t) => t.includes('meta descripción'))).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 6. PLANS & SETTINGS TRUTH (B17, B30, B31)
  // ---------------------------------------------------------------------------
  it('10. plans section marks comparison as preview and does not contain native alert()', () => {
    const plansPath = path.resolve(__dirname, '../components/settings/sections/plans-section.tsx');
    const plansContent = fs.readFileSync(plansPath, 'utf8');

    expect(plansContent).toContain('Vista preliminar de planes SaaS');
    expect(plansContent).not.toContain('PLAN ACTUAL');
    expect(plansContent).not.toContain('alert(');
  });

  it('11. general section separates interface preferences from catalog languages', () => {
    const generalPath = path.resolve(__dirname, '../components/settings/sections/general-section.tsx');
    const generalContent = fs.readFileSync(generalPath, 'utf8');

    expect(generalContent).toContain('Preferencias de la Interfaz');
    expect(generalContent).toContain('Idiomas del Catálogo');
    expect(generalContent).toContain('1 de 1 idiomas habilitados');
    expect(generalContent).toContain('Tu configuración actual permite 1 idioma');
  });

  // ---------------------------------------------------------------------------
  // 7. FEEDBACK REWARD INTEGRITY (B28)
  // ---------------------------------------------------------------------------
  it('12. feedback action enforces allowed feedback types and prevents client credit minting', () => {
    const feedbackActionsPath = path.resolve(__dirname, 'feedback-actions.ts');
    const content = fs.readFileSync(feedbackActionsPath, 'utf8');

    expect(content).toContain("['BUG', 'IMPROVEMENT', 'FEATURE']");
    expect(content).not.toContain('rewardCredits'); // Client never sends rewardCredits!
  });
});
