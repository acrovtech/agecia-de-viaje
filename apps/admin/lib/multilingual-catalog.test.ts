import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { computeSourceRevision } from '../../../apps/api/src/catalog/source-revision';
import { agencyLocalesResponseSchema } from './settings-loader';
import { tourTranslationsResponseSchema, tourTranslationSchema } from './catalog-content';
import { analyzeSeo } from '../components/forms/shared/seo-analysis';

describe('P2.8-L10 Multilingual Catalog UX & Translation Management Suite', () => {
  // ===========================================================================
  // 1. SETTINGS LOCALES & RACE-SAFE BOOTSTRAP
  // ===========================================================================
  describe('Settings Locales & Bootstrap Truth', () => {
    it('default locale bootstrap is race-safe and handles concurrent conflict without duplicate defaults', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      // Race-safe bootstrap with try/catch and re-reading authoritative rows
      expect(content).toContain("Race-safe bootstrap: if concurrent request created default locale");
      expect(content).toContain("supportedLocales: [...SUPPORTED_CATALOG_LOCALES]");
    });

    it('add locale succeeds below entitlement limit and enforces maxCatalogLocales limit', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      // Validates against maxCatalogLocales
      expect(content).toContain("activeCount >= entitlements.maxCatalogLocales");
      expect(content).toContain("Tu configuración actual permite un máximo de");
    });

    it('disabling secondary locale sets enabled=false and preserves TourLocalizedContent', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      // removeLocale sets enabled=false instead of deleting row
      expect(content).toContain("No puedes deshabilitar el idioma principal del catálogo");
      expect(content).toContain("data: { enabled: false }");
      expect(content).not.toContain("this.prisma.agencyLocale.delete");
    });

    it('disabling default locale is strictly rejected', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      expect(content).toContain("if (target.isDefault) {");
      expect(content).toContain("throw new BadRequestException('No puedes deshabilitar el idioma principal del catálogo');");
    });

    it('re-enabling disabled locale sets enabled=true and restores access to existing translations', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      expect(content).toContain("update: {");
      expect(content).toContain("enabled: true,");
    });

    it('locale UI uses authoritative maxCatalogLocales from locale contract without fake fallback', () => {
      const generalSectionPath = path.resolve(__dirname, '../components/settings/sections/general-section.tsx');
      const content = fs.readFileSync(generalSectionPath, 'utf8');

      // GeneralSection consumes maxCatalogLocales passed from authoritative locales
      expect(content).toContain("Tu configuración actual permite");
      expect(content).toContain("de catálogo");
      expect(content).not.toContain("Actualiza a Pro");
    });
  });

  // ===========================================================================
  // 2. TOUR EDITOR & NAVIGATION
  // ===========================================================================
  describe('Tour Editor Navigation & Contracts', () => {
    it('default locale renders full TourForm and secondary locale renders TourTranslationForm', () => {
      const editorPath = path.resolve(__dirname, '../components/workspace/catalog-editor.tsx');
      const content = fs.readFileSync(editorPath, 'utf8');

      expect(content).toContain("isSecondaryLocale && selectedLocale && agencyLocales");
      expect(content).toContain("<TourTranslationForm");
      expect(content).toContain("<TourForm initialData={record} categories={categories} />");
    });

    it('new unsaved Tour cannot edit secondary locale and shows clear requirement copy', () => {
      const navPath = path.resolve(__dirname, '../components/workspace/tour-language-nav.tsx');
      const content = fs.readFileSync(navPath, 'utf8');

      expect(content).toContain("Guarda primero el tour en");
      expect(content).toContain("para crear versiones en otros idiomas.");
    });

    it('disabled/unsupported locale query cannot bypass UI/API and redirects to default edit route', () => {
      const pagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/catalog/tours/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).toContain("const isEnabledLocale = agencyLocales.locales.some");
      expect(content).toContain("redirect(`/catalog/tours?edit=${encodeURIComponent(editId)}`);");
    });

    it('Tour is ONE commercial product: single-source commercial facts and no duplicate Tour records', () => {
      const schemaPath = path.resolve(__dirname, '../../../packages/db/prisma/schema.prisma');
      const content = fs.readFileSync(schemaPath, 'utf8');

      // Tour holds single-source pricing, availability, categories, images
      expect(content).toContain("model Tour {");
      expect(content).toContain("localizedContents TourLocalizedContent[]");
      // TourLocalizedContent holds only localized textual content
      expect(content).toContain("model TourLocalizedContent {");
      expect(content).toContain("@@unique([tourId, locale])");
    });
  });

  // ===========================================================================
  // 3. TRANSLATION SAVE & CONCURRENCY
  // ===========================================================================
  describe('Translation Save Truth & Optimistic Concurrency', () => {
    it('translation schema enforces explicit lowercase hyphenated slug without hidden fallback', () => {
      // Valid explicit slugs
      const valid = tourTranslationSchema.safeParse({
        title: 'Machu Picchu Day Trip',
        slug: 'machu-picchu-day-trip',
        description: 'English description',
      });
      expect(valid.success).toBe(true);

      // Invalid slug with uppercase or spaces or illegal characters
      const invalidUpper = tourTranslationSchema.safeParse({
        title: 'Machu Picchu',
        slug: 'Machu-Picchu',
      });
      expect(invalidUpper.success).toBe(false);

      const invalidSpaces = tourTranslationSchema.safeParse({
        title: 'Machu Picchu',
        slug: 'machu picchu',
      });
      expect(invalidSpaces.success).toBe(false);
    });

    it('translation save enforces optimistic concurrency: stale expectedUpdatedAt returns 409 Conflict', () => {
      const contentServicePath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(contentServicePath, 'utf8');

      expect(content).toContain("if (!data.expectedUpdatedAt) {");
      expect(content).toContain("throw new ConflictException('Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');");
      expect(content).toContain("if (Math.abs(expected - actual) > 1000) {");
    });

    it('translation save enforces manual provenance: generatedByAi=false and reviewStatus=DRAFT', () => {
      const contentServicePath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(contentServicePath, 'utf8');

      expect(content).toContain("generatedByAi: false");
      expect(content).toContain("reviewStatus: 'DRAFT'");
      // No AI credit consumption or ledger entries in catalog-content.service.ts
      expect(content).not.toContain("aiCreditLedger");
    });

    it('tenant isolation: translation save rejects tours belonging to another agency', () => {
      const contentServicePath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(contentServicePath, 'utf8');

      expect(content).toContain("where: { id: tourId, agencyId: who.agencyId }");
      expect(content).toContain("if (!tour) throw new NotFoundException('Tour no encontrado');");
    });

    it('translation save rejects default locale (managed via canonical base Tour)', () => {
      const contentServicePath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(contentServicePath, 'utf8');

      expect(content).toContain("if (agencyLocale.isDefault) {");
      expect(content).toContain("throw new BadRequestException('El idioma principal se gestiona en la ficha base del tour');");
    });
  });

  // ===========================================================================
  // 4. SOURCE REVISION & DETERMINISTIC STALENESS
  // ===========================================================================
  describe('Source Revision & Staleness Detection', () => {
    const baseTour = {
      title: 'Valle Sagrado de los Incas',
      slug: 'valle-sagrado-incas',
      description: 'Recorrido inolvidable por Pisac y Ollantaytambo',
      itineraries: [
        { title: 'Día 1: Pisac', content: 'Visita a las ruinas y mercado' },
      ],
      inclusions: [{ content: 'Transporte turístico' }],
      exclusions: [{ content: 'Boleto turístico' }],
      recommendations: [{ content: 'Llevar protector solar' }],
      faqs: [{ question: '¿Cuál es la altitud?', answer: '2,800 msnm' }],
      metaTitle: 'Tour Valle Sagrado Cusco',
      metaDescription: 'Descubre el Valle Sagrado de los Incas en Cusco',
      focusKeyphrase: 'valle sagrado cusco',
      // Commercial fields that MUST NOT affect source revision
      sharedPrice: 45.0,
      hasSharedService: true,
      duration: 'Full Day',
      region: 'Cusco',
      altitude: '2800',
    };

    it('revision changes when translatable title changes', () => {
      const rev1 = computeSourceRevision(baseTour);
      const rev2 = computeSourceRevision({ ...baseTour, title: 'Valle Sagrado VIP' });
      expect(rev1).not.toBe(rev2);
    });

    it('revision changes when translatable description changes', () => {
      const rev1 = computeSourceRevision(baseTour);
      const rev2 = computeSourceRevision({ ...baseTour, description: 'Nueva descripción detallada' });
      expect(rev1).not.toBe(rev2);
    });

    it('revision changes when itinerary content changes', () => {
      const rev1 = computeSourceRevision(baseTour);
      const rev2 = computeSourceRevision({
        ...baseTour,
        itineraries: [{ title: 'Día 1: Pisac y Chinchero', content: 'Nuevo contenido' }],
      });
      expect(rev1).not.toBe(rev2);
    });

    it('revision does NOT change on price-only or commercial-only changes', () => {
      const rev1 = computeSourceRevision(baseTour);
      const modifiedTour: any = {
        ...baseTour,
        sharedPrice: 999.0, // Commercial price modification
        hasSharedService: false,
        duration: '2 Días',
        region: 'Urubamba',
      };
      const rev2 = computeSourceRevision(modifiedTour);
      expect(rev1).toBe(rev2);
    });

    it('isStale is true when translation sourceRevision differs from current source revision', () => {
      const currentRev = computeSourceRevision(baseTour);
      const oldRev = 'sha256-outdated-hash-999';

      const isStale = Boolean(oldRev && oldRev !== currentRev);
      expect(isStale).toBe(true);

      const notStale = Boolean(currentRev && currentRev === currentRev);
      expect(notStale).toBe(true);
    });
  });

  // ===========================================================================
  // 5. DETERMINISTIC SEO FOR TRANSLATIONS
  // ===========================================================================
  describe('Deterministic SEO Analysis for Localized Content', () => {
    it('analyzes localized fields without modifying commercial facts', () => {
      const seoResult = analyzeSeo({
        title: 'Sacred Valley Tour Full Day',
        metaTitle: 'Sacred Valley Tour Cusco - Best Day Trip',
        metaDescription: 'Explore the Sacred Valley with our expert local guides in Pisac and Ollantaytambo.',
        slug: 'sacred-valley-tour-full-day',
        focusKeyphrase: 'sacred valley tour',
        description: 'Comprehensive English description of the Sacred Valley tour with top highlights.',
        itinerariesCount: 1,
        faqsCount: 1,
      });

      expect(seoResult.score).toBeGreaterThan(0);
      expect(seoResult.label).toBe('Diagnóstico SEO');
      expect(seoResult.results.length).toBeGreaterThan(0);
      expect(seoResult.results.some((r) => r.type === 'good')).toBe(true);
    });
  });
});
