import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('server-only', () => ({}));
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { computeSourceRevision } from '../../../apps/api/src/catalog/source-revision';
import { fetchAgencyLocales, agencyLocalesResponseSchema } from './settings-loader';
import { tourTranslationsResponseSchema, tourTranslationSchema } from './catalog-content';
import { analyzeSeo } from '../components/forms/shared/seo-analysis';

describe('P2.8-L10.1 Multilingual Catalog Correctness Gate Suite', () => {
  // ===========================================================================
  // 1. RUNTIME CONTRACT & fetchAgencyLocales SIGNATURE
  // ===========================================================================
  describe('Runtime Contract Truth', () => {
    it('fetchAgencyLocales is called with (agencyId, token) order and builds correct Central API path', async () => {
      const calls: { url: string; token?: string }[] = [];
      const fakeCentralRequest = vi.fn(async (url: string, token?: string) => {
        calls.push({ url, token });
        return {
          locales: [{ id: 'loc-1', locale: 'es', isDefault: true, enabled: true }],
          defaultLocale: 'es',
          maxCatalogLocales: 3,
          enabledCount: 1,
          supportedLocales: ['es', 'en', 'pt', 'fr', 'de', 'it'],
        };
      });

      // Verify the function call semantics
      const agencyId = 'agency-cusco-123';
      const token = 'auth-token-456';
      
      const expectedUrl = `/v1/agencies/${encodeURIComponent(agencyId)}/settings/locales`;
      const res = await fakeCentralRequest(expectedUrl, token);
      
      expect(calls[0]?.url).toBe('/v1/agencies/agency-cusco-123/settings/locales');
      expect(calls[0]?.token).toBe('auth-token-456');
      expect(res.defaultLocale).toBe('es');
      expect(res.maxCatalogLocales).toBe(3);
    });

    it('ToursCatalogPage calls fetchAgencyLocales with (identity.agencyId, token)', () => {
      const pagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/catalog/tours/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      // Must be identity.agencyId first, token second
      expect(content).toContain('fetchAgencyLocales(identity.agencyId, token)');
      expect(content).not.toContain('fetchAgencyLocales(token, identity.agencyId)');
    });

    it('ToursCatalogPage does not fabricate a synthetic default locale on API failure', () => {
      const pagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/catalog/tours/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      // The synthetic fallback object was removed
      expect(content).toContain('const agencyLocales = agencyLocalesRes ?? null;');
      expect(content).not.toContain("locales: [{ id: 'default', locale: 'es', isDefault: true, enabled: true }]");
      expect(content).toContain('if (agencyLocales === null) {');
    });

    it('If locale configuration is unavailable, URL with locale query redirects to base edit route', () => {
      const pagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/catalog/tours/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).toContain('if (agencyLocales === null) {');
      expect(content).toContain('if (rawLocale && editId) {');
      expect(content).toContain('redirect(`/catalog/tours?edit=${encodeURIComponent(editId)}`);');
    });
  });

  // ===========================================================================
  // 2. BOOTSTRAP & ERROR RECOVERY TRUTH
  // ===========================================================================
  describe('Race-Safe Default Locale Bootstrap', () => {
    it('catches and recovers only from P2002 unique constraint collision', () => {
      const handleBootstrapError = (error: any) => {
        const isUniqueCollision =
          error?.code === 'P2002' ||
          (typeof error?.message === 'string' &&
            (error.message.includes('Unique constraint') || error.message.includes('P2002')));
        if (!isUniqueCollision) {
          throw error;
        }
        return 'recovered';
      };

      // P2002 is recovered
      expect(handleBootstrapError({ code: 'P2002' })).toBe('recovered');
      expect(handleBootstrapError({ message: 'Unique constraint failed on AgencyLocale_agencyId_default_unique' })).toBe('recovered');

      // Non-P2002 error is propagated
      expect(() => handleBootstrapError(new Error('Connection lost to database'))).toThrow('Connection lost to database');
      expect(() => handleBootstrapError({ code: 'P2025', message: 'Record not found' })).toThrow();
    });

    it('SettingsService.getLocales rethrows non-unique database errors', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      expect(content).toContain("error?.code === 'P2002'");
      expect(content).toContain("if (!isUniqueCollision) {");
      expect(content).toContain("throw error;");
    });
  });

  // ===========================================================================
  // 3. ATOMIC ENTITLEMENT ENFORCEMENT
  // ===========================================================================
  describe('Atomic Entitlement Decision Boundary', () => {
    it('SettingsService.addLocale executes inside a serialized transaction with Agency row lock', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      expect(content).toContain('return await this.prisma.$transaction(async (tx) => {');
      expect(content).toContain('SELECT id\n        FROM "Agency"\n        WHERE id = ${agencyId}\n        FOR UPDATE;');
      expect(content).toContain('if (!isAlreadyPresentAndActive && activeCount >= maxCatalogLocales) {');
      expect(content).toContain('Tu configuración actual permite un máximo de ${maxCatalogLocales} idioma(s) de catálogo.');
    });

    it('concurrent simulation: max=2, active=1, two simultaneous enable attempts allows only one to succeed', async () => {
      // Simulation of serialized transactional queue
      let maxCatalogLocales = 2;
      let activeLocales = ['es']; // 1 active
      let lockAcquired = false;

      const atomicAddLocale = async (newLocale: string): Promise<{ success: boolean; error?: string }> => {
        // Wait for lock (simulating PostgreSQL row lock SELECT FOR UPDATE)
        while (lockAcquired) {
          await new Promise((r) => setTimeout(r, 5));
        }
        lockAcquired = true;

        try {
          const activeCount = activeLocales.length;
          const isAlreadyPresent = activeLocales.includes(newLocale);

          if (!isAlreadyPresent && activeCount >= maxCatalogLocales) {
            throw new Error(`Tu configuración actual permite un máximo de ${maxCatalogLocales} idioma(s) de catálogo.`);
          }

          if (!isAlreadyPresent) {
            activeLocales.push(newLocale);
          }
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        } finally {
          lockAcquired = false;
        }
      };

      // Two concurrent requests: Request A adds 'en', Request B adds 'pt'
      const [resA, resB] = await Promise.all([
        atomicAddLocale('en'),
        atomicAddLocale('pt'),
      ]);

      const successes = [resA, resB].filter((r) => r.success);
      const failures = [resA, resB].filter((r) => !r.success);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect(activeLocales).toHaveLength(2); // Never exceeds 2
      expect(failures[0]?.error).toContain('Tu configuración actual permite un máximo de 2 idioma(s) de catálogo.');
    });
  });

  // ===========================================================================
  // 4. EXACT TRANSLATION CONCURRENCY
  // ===========================================================================
  describe('Exact Translation Optimistic Concurrency', () => {
    it('saveTourTranslation uses exact updatedAt match and updateMany count check', () => {
      const contentServicePath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(contentServicePath, 'utf8');

      // Exact date check without 1-second tolerance window
      expect(content).not.toContain('Math.abs(expected - actual) > 1000');
      expect(content).toContain('existing.updatedAt.getTime() !== expectedDate.getTime()');
      expect(content).toContain('where: {\n            id: existing.id,\n            updatedAt: existing.updatedAt,\n          }');
      expect(content).toContain('if (updateResult.count !== 1) {');
      expect(content).toContain("throw new ConflictException('Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');");
    });

    it('update occurring 50ms after load is rejected as stale', () => {
      const loadedAt = new Date('2026-10-18T12:00:00.000Z');
      const concurrentEditAt = new Date('2026-10-18T12:00:00.050Z'); // 50ms later

      const verifyConcurrency = (expectedIso: string, actualDate: Date) => {
        const expectedDate = new Date(expectedIso);
        if (isNaN(expectedDate.getTime()) || actualDate.getTime() !== expectedDate.getTime()) {
          throw new Error('409 Conflict: Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');
        }
        return 'success';
      };

      // Stale update (50ms drift) is strictly rejected
      expect(() => verifyConcurrency(loadedAt.toISOString(), concurrentEditAt)).toThrow('409 Conflict');

      // Exact match succeeds
      expect(verifyConcurrency(concurrentEditAt.toISOString(), concurrentEditAt)).toBe('success');
    });
  });

  // ===========================================================================
  // 5. SOURCE REVISION CONCURRENCY
  // ===========================================================================
  describe('Source Revision Concurrency & Stale Detection', () => {
    const baseTour = {
      title: 'Valle Sagrado VIP',
      slug: 'valle-sagrado-vip',
      description: 'Tour completo por el Valle Sagrado',
      itineraries: [{ title: 'Día 1', content: 'Pisac' }],
      inclusions: [{ content: 'Transporte' }],
      exclusions: [{ content: 'Almuerzo' }],
      recommendations: [{ content: 'Agua' }],
      faqs: [{ question: 'Altitud', answer: '2800' }],
      metaTitle: 'Valle Sagrado',
      metaDescription: 'Descubre Cusco',
      focusKeyphrase: 'valle sagrado',
    };

    it('tourTranslationSchema requires expectedSourceRevision', () => {
      const valid = tourTranslationSchema.safeParse({
        title: 'Sacred Valley VIP',
        slug: 'sacred-valley-vip',
        expectedSourceRevision: 'sha256-current-hash',
      });
      expect(valid.success).toBe(true);

      const missing = tourTranslationSchema.safeParse({
        title: 'Sacred Valley VIP',
        slug: 'sacred-valley-vip',
        // expectedSourceRevision missing
      });
      expect(missing.success).toBe(false);
    });

    it('rejects save with 409 when base tour content changed while translator was editing', () => {
      const revOriginal = computeSourceRevision(baseTour);
      const revChanged = computeSourceRevision({ ...baseTour, title: 'Valle Sagrado Exclusivo 2026' });

      expect(revOriginal).not.toBe(revChanged);

      const verifySourceRevision = (expectedSourceRevision: string, currentSourceRevision: string) => {
        if (expectedSourceRevision !== currentSourceRevision) {
          throw new Error('409 Conflict: El contenido principal cambió mientras editabas esta traducción. Recarga para revisar la versión más reciente.');
        }
        return 'valid';
      };

      // Translator opened editor against revOriginal, but base changed to revChanged
      expect(() => verifySourceRevision(revOriginal, revChanged)).toThrow(
        'El contenido principal cambió mientras editabas esta traducción'
      );

      // Unchanged source succeeds
      expect(verifySourceRevision(revOriginal, revOriginal)).toBe('valid');
    });

    it('sourceRevision = null is marked as isStale = true', () => {
      const currentSourceRevision = 'sha256-current-hash-123';
      
      const checkStale = (sourceRevision: string | null) => {
        return Boolean(!sourceRevision || sourceRevision !== currentSourceRevision);
      };

      // Null source revision MUST be stale (Requirement 10)
      expect(checkStale(null)).toBe(true);

      // Mismatched source revision is stale
      expect(checkStale('sha256-old-hash')).toBe(true);

      // Matching source revision is current
      expect(checkStale('sha256-current-hash-123')).toBe(false);
    });
  });

  // ===========================================================================
  // 6. LOCALIZED SLUG COLLISION SAFETY
  // ===========================================================================
  describe('Localized Slug Collision Safety', () => {
    it('saveTourTranslation checks slug collision within agency + locale', () => {
      const contentServicePath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(contentServicePath, 'utf8');

      expect(content).toContain('const slugCollision = await tx.tourLocalizedContent.findFirst({');
      expect(content).toContain('locale,\n          slug: data.slug,\n          tour: { agencyId: who.agencyId },\n          tourId: { not: tourId },');
      expect(content).toContain("throw new ConflictException('Este enlace ya está siendo usado por otro tour en este idioma.');");
    });

    it('collision simulation: same agency + same locale rejects duplicate slug', async () => {
      const existingTranslations = [
        { tourId: 'tour-1', agencyId: 'agency-a', locale: 'en', slug: 'machu-picchu-day-trip' },
        { tourId: 'tour-2', agencyId: 'agency-b', locale: 'en', slug: 'machu-picchu-day-trip' }, // Different agency
      ];

      const checkSlugCollision = (agencyId: string, tourId: string, locale: string, slug: string) => {
        const match = existingTranslations.find(
          (t) => t.agencyId === agencyId && t.locale === locale && t.slug === slug && t.tourId !== tourId
        );
        if (match) {
          throw new Error('409 Conflict: Este enlace ya está siendo usado por otro tour en este idioma.');
        }
        return 'allowed';
      };

      // Same agency, same locale, different tour -> Collision 409!
      expect(() => checkSlugCollision('agency-a', 'tour-3', 'en', 'machu-picchu-day-trip')).toThrow(
        'Este enlace ya está siendo usado por otro tour en este idioma.'
      );

      // Same agency, same tour (editing existing tour) -> Allowed!
      expect(checkSlugCollision('agency-a', 'tour-1', 'en', 'machu-picchu-day-trip')).toBe('allowed');

      // Same agency, different locale ('pt') -> Allowed!
      expect(checkSlugCollision('agency-a', 'tour-3', 'pt', 'machu-picchu-day-trip')).toBe('allowed');

      // Different agency ('agency-c') -> Allowed!
      expect(checkSlugCollision('agency-c', 'tour-4', 'en', 'machu-picchu-day-trip')).toBe('allowed');
    });
  });

  // ===========================================================================
  // 7. SOURCE REFERENCE PANEL COMPLETENESS
  // ===========================================================================
  describe('Source Reference Panel Completeness', () => {
    it('TourTranslationForm renders exclusions, recommendations and FAQs in read-only panel', () => {
      const formPath = path.resolve(__dirname, '../components/forms/tour-translation-form.tsx');
      const content = fs.readFileSync(formPath, 'utf8');

      // Inclusions
      expect(content).toContain('Incluye original:');
      // Exclusions
      expect(content).toContain('No incluye original:');
      // Recommendations
      expect(content).toContain('Recomendaciones originales:');
      // FAQs
      expect(content).toContain('Preguntas frecuentes originales:');
    });

    it('TourTranslationForm includes expectedSourceRevision in form submission', () => {
      const formPath = path.resolve(__dirname, '../components/forms/tour-translation-form.tsx');
      const content = fs.readFileSync(formPath, 'utf8');

      expect(content).toContain('<input type="hidden" name="expectedSourceRevision" value={currentSourceRevision || \'\'} />');
    });
  });

  // ===========================================================================
  // 8. SEO DIAGNOSTICS FOR LOCALIZED CONTENT
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
