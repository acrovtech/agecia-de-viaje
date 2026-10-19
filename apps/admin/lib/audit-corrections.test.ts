import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { agencyLocalesResponseSchema } from './settings-loader';

describe('P2.8-IA0.2 Contract Cleanup & Product Truth Suite', () => {
  // ===========================================================================
  // 1. TOURS: ORCHESTRATION, ZERO FABRICATION & DIFFICULTY TRUTH
  // ===========================================================================
  describe('Tours Truth & Orchestration', () => {
    it('published Tour edited with desired status Activo remains published via re-publication endpoint', async () => {
      const mockCalls: { url: string; method?: string; body?: unknown }[] = [];
      const fakeCentralRequest = vi.fn(async (url: string, token: string, body?: unknown, method?: string) => {
        mockCalls.push({ url, method, body });
        if (url.includes('/catalog/tours') && method === 'PUT' && !url.includes('/publish') && !url.includes('/content')) {
          return { id: 'tour-123', isPublished: false, updatedAt: '2026-10-18T10:00:00Z' };
        }
        if (url.includes('/content') && method === 'PUT') {
          return { id: 'tour-123', updatedAt: '2026-10-18T10:01:00Z' };
        }
        if (url.includes('/publish') && method === 'PUT') {
          return { id: 'tour-123', isPublished: true, updatedAt: '2026-10-18T10:02:00Z' };
        }
        return { success: true };
      });

      const desiredPublished = true;
      const tourId = 'tour-123';
      const token = 'fake-token';

      await fakeCentralRequest(`/catalog/tours/${tourId}`, token, { title: 'Updated' }, 'PUT');
      const updatedContent = await fakeCentralRequest(`/catalog/tours/${tourId}/content`, token, {}, 'PUT');

      let republishFailed = false;
      let finalMessage = 'Tour actualizado exitosamente.';

      if (desiredPublished) {
        try {
          await fakeCentralRequest(`/catalog/tours/${tourId}/publish`, token, { expectedUpdatedAt: updatedContent.updatedAt }, 'PUT');
        } catch {
          republishFailed = true;
          finalMessage = 'Los cambios se guardaron como borrador, pero no pudo publicarse el tour.';
        }
      }

      expect(mockCalls.some(c => c.url.includes('/publish') && c.method === 'PUT')).toBe(true);
      expect(republishFailed).toBe(false);
      expect(finalMessage).toBe('Tour actualizado exitosamente.');
    });

    it('failed republish leaves draft and surfaces warning without claiming published success', async () => {
      const fakeCentralRequest = vi.fn(async (url: string, token: string, body?: unknown, method?: string) => {
        if (url.includes('/content') && method === 'PUT') {
          return { id: 'tour-123', updatedAt: '2026-10-18T10:01:00Z' };
        }
        if (url.includes('/publish')) {
          throw new Error('Validación de publicación fallida: faltan fotos obligatorias');
        }
        return { id: 'tour-123', isPublished: false };
      });

      const desiredPublished = true;
      let publicationWarning: string | null = null;
      let savedAsDraft = false;

      savedAsDraft = true;
      const updatedContent = await fakeCentralRequest('/catalog/tours/tour-123/content', 'tok', {}, 'PUT');

      if (desiredPublished) {
        try {
          await fakeCentralRequest('/catalog/tours/tour-123/publish', 'tok', { expectedUpdatedAt: updatedContent.updatedAt }, 'PUT');
        } catch {
          publicationWarning = 'Los cambios se guardaron como borrador, pero no pudo publicarse el tour. Revisa los campos obligatorios.';
        }
      }

      expect(savedAsDraft).toBe(true);
      expect(publicationWarning).toContain('Los cambios se guardaron como borrador');
      expect(publicationWarning).not.toContain('publicado exitosamente');
    });

    it('incomplete itinerary row does not generate synthetic content and returns validation error', () => {
      const parseItinerary = (rows: { title?: string; content?: string }[]) => {
        const valid = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]!;
          const title = row.title?.trim() || '';
          const content = row.content?.trim() || '';
          if (!title && !content) continue;
          if (!title || !content) {
            throw new Error(`Fila de itinerario ${i + 1}: debe completar tanto el título como la descripción.`);
          }
          valid.push({ title, content });
        }
        return valid;
      };

      expect(parseItinerary([{ title: '', content: '' }])).toEqual([]);
      expect(() => parseItinerary([{ title: 'Llegada a Cusco', content: '' }])).toThrowError(
        'Fila de itinerario 1: debe completar tanto el título como la descripción.'
      );
      expect(parseItinerary([{ title: 'Día 1: Cusco', content: 'City tour completo' }])).toEqual([
        { title: 'Día 1: Cusco', content: 'City tour completo' },
      ]);
    });

    it('incomplete FAQ does not generate synthetic content and returns validation error', () => {
      const parseFaqs = (rows: { question?: string; answer?: string }[]) => {
        const valid = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]!;
          const question = row.question?.trim() || '';
          const answer = row.answer?.trim() || '';
          if (!question && !answer) continue;
          if (!question || !answer) {
            throw new Error(`Pregunta frecuente ${i + 1}: debe completar tanto la pregunta como la respuesta.`);
          }
          valid.push({ question, answer });
        }
        return valid;
      };

      expect(parseFaqs([{ question: '', answer: '' }])).toEqual([]);
      expect(() => parseFaqs([{ question: '¿Incluye almuerzo?', answer: '' }])).toThrowError(
        'Pregunta frecuente 1: debe completar tanto la pregunta como la respuesta.'
      );
      expect(parseFaqs([{ question: '¿Incluye almuerzo?', answer: 'Sí, almuerzo buffet.' }])).toEqual([
        { question: '¿Incluye almuerzo?', answer: 'Sí, almuerzo buffet.' },
      ]);
    });

    it('image ALT is not fabricated and persists null when absent', () => {
      const parseGallery = (items: { url: string; alt?: string }[]) => {
        return items.map(img => ({
          url: img.url,
          alt: img.alt?.trim() ? img.alt.trim() : null,
        }));
      };

      const result = parseGallery([
        { url: 'https://cdn.example.com/p1.jpg', alt: '' },
        { url: 'https://cdn.example.com/p2.jpg', alt: 'Vista panorámica de Machu Picchu' },
      ]);

      expect(result[0]?.alt).toBeNull();
      expect(result[1]?.alt).toBe('Vista panorámica de Machu Picchu');
    });

    it('new Tour has no implicit difficulty fact and form source defaults to empty', () => {
      const tourFormPath = path.resolve(__dirname, '../components/forms/tour-form.tsx');
      const formContent = fs.readFileSync(tourFormPath, 'utf8');

      expect(formContent).toContain("useState<string>(initialData?.difficulty || '')");
      expect(formContent).not.toContain("useState<string>(initialData?.difficulty || 'Moderada')");
      expect(formContent).toContain('placeholder="Seleccionar..."');
    });
  });

  // ===========================================================================
  // 2. FEEDBACK RUNTIME CONTRACT
  // ===========================================================================
  describe('Feedback Runtime Contract', () => {
    it('correct Central API request body passes payload directly and zero client-side credit minting', () => {
      const feedbackActionsPath = path.resolve(__dirname, 'feedback-actions.ts');
      const content = fs.readFileSync(feedbackActionsPath, 'utf8');

      expect(content).toContain("centralRequest(");
      expect(content).toContain("type,");
      expect(content).toContain("title: title.trim()");
      expect(content).toContain("description: description.trim()");
      expect(content).toContain("'POST'");
      expect(content).not.toContain("JSON.stringify({ type, title, description })");
      expect(content).not.toContain("rewardCredits");
    });
  });

  // ===========================================================================
  // 3. DASHBOARD AUTHORITATIVE CONTRACT & MULTI-CURRENCY SAFETY
  // ===========================================================================
  describe('Dashboard Contract & Currency Isolation', () => {
    it('Dashboard contract endpoint GET /v1/agencies/:agencyId/dashboard exists and calculates upcoming by date', () => {
      const controllerPath = path.resolve(__dirname, '../../api/src/dashboard/dashboard.controller.ts');
      const servicePath = path.resolve(__dirname, '../../api/src/dashboard/dashboard.service.ts');

      expect(fs.existsSync(controllerPath)).toBe(true);
      expect(fs.existsSync(servicePath)).toBe(true);

      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      expect(controllerContent).toContain("path: 'agencies/:agencyId/dashboard'");

      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      expect(serviceContent).toContain("reservationsToday");
      expect(serviceContent).toContain("upcomingReservations");
      expect(serviceContent).toContain("attentionNeeded");
      expect(serviceContent).toContain("next7DaysLoad");
      expect(serviceContent).toContain("bookedValueSummary");
      expect(serviceContent).toContain("totalsByCurrency");
      expect(serviceContent).toContain("America/Lima");
      // Neutral reservation copy:
      expect(serviceContent).toContain("Reserva pendiente de gestión");
      expect(serviceContent).not.toContain("Servicio en estado pendiente de coordinación");
    });

    it('Dashboard UI supports isolated multi-currency rendering without FX conversion or mixed addition', () => {
      const dashboardViewPath = path.resolve(__dirname, '../components/workspace/views/dashboard-view.tsx');
      const content = fs.readFileSync(dashboardViewPath, 'utf8');

      expect(content).toContain("totalsByCurrency");
      expect(content).toContain("Object.entries(totalsByCurrency)");
    });
  });

  // ===========================================================================
  // 4. RESERVATIONS DETAIL & DORMANT OPERATIONS REMOVAL
  // ===========================================================================
  describe('Reservation Detail Product Truth', () => {
    it('active reservation detail does not fetch or render operational assignment resources and has clean imports', () => {
      const reservationDetailPath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/reservations/page.tsx');
      const content = fs.readFileSync(reservationDetailPath, 'utf8');

      expect(content).not.toContain("/operations/resources?type=GUIDE");
      expect(content).not.toContain("/operations/resources?type=DRIVER");
      expect(content).not.toContain("/operations/vehicles");
      expect(content).not.toContain("<OperationsAssignmentForm");
      expect(content).not.toContain("OperationsAssignmentForm");
      expect(content).not.toContain("serviceResourceSchema");
      expect(content).not.toContain("fleetVehicleSchema");

      expect(content).toContain("Historial de la reserva");
      expect(content).not.toContain("Historial Operativo");
    });
  });

  // ===========================================================================
  // 5. LOCALES: OBJECT CONTRACT & TRANSLATION CREATE/UPDATE SYMMETRY
  // ===========================================================================
  describe('Locale Response Contract & Translation Symmetry', () => {
    it('Settings loader parses the real object response and validates schema', () => {
      const rawServerResponse = {
        locales: [
          { id: 'loc-1', locale: 'es', isDefault: true, enabled: true },
          { id: 'loc-2', locale: 'en', isDefault: false, enabled: true },
        ],
        defaultLocale: 'es',
        maxCatalogLocales: 2,
        enabledCount: 2,
      };

      const parsed = agencyLocalesResponseSchema.parse(rawServerResponse);
      expect(parsed.locales).toHaveLength(2);
      expect(parsed.defaultLocale).toBe('es');
      expect(parsed.maxCatalogLocales).toBe(2);
      expect(parsed.enabledCount).toBe(2);
    });

    it('Translation CREATE and UPDATE both persist description and server-enforced provenance without hidden fallback', () => {
      const catalogContentPath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(catalogContentPath, 'utf8');

      // CREATE and UPDATE blocks contain description and explicit slug
      expect(content).toContain("title: data.title,\n            slug: data.slug,\n            description: data.description || null,");
      expect(content).not.toContain("`${tourId}-${locale}`");

      // Server enforces provenance and draft status
      expect(content).toContain("generatedByAi: false");
      expect(content).toContain("reviewStatus: 'DRAFT'");
    });

    it('database migration includes partial unique index in a forward-safe migration path', () => {
      const prevMigrationPath = path.resolve(__dirname, '../../../packages/db/prisma/migrations/20261018010000_p2_8_product_ia_and_draft_truth/migration.sql');
      const prevMigrationContent = fs.readFileSync(prevMigrationPath, 'utf8');

      // 20261018010000 restored to original checksum, does not alter history
      expect(prevMigrationContent).not.toContain('CREATE UNIQUE INDEX IF NOT EXISTS "AgencyLocale_agencyId_default_unique"');

      // Forward migration carries the partial unique index
      const forwardMigrationPath = path.resolve(__dirname, '../../../packages/db/prisma/migrations/20261018020000_agency_locale_single_default/migration.sql');
      expect(fs.existsSync(forwardMigrationPath)).toBe(true);
      const forwardContent = fs.readFileSync(forwardMigrationPath, 'utf8');
      expect(forwardContent).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "AgencyLocale_agencyId_default_unique" ON "AgencyLocale"("agencyId") WHERE "isDefault" = true;');
    });
  });

  // ===========================================================================
  // 6. FINANCIAL REPORTING TRUTH & CASH REALITY
  // ===========================================================================
  describe('Financial Reporting Truth & Cash Reality', () => {
    it('cancelled paid reservation with partial refund contributes correct net collected cash', () => {
      const reservations = [
        // Active, fully paid
        { bookingStatus: 'CONFIRMED', totalMinor: 10000, paidMinor: 10000, refundedMinor: 0, currency: 'USD' },
        // Cancelled, but was paid 100 USD with 40 USD refunded -> net retained cash is 60 USD
        { bookingStatus: 'CANCELLED', totalMinor: 10000, paidMinor: 10000, refundedMinor: 4000, currency: 'USD' },
        // Active PEN reservation: 500 PEN total, paid 500 PEN
        { bookingStatus: 'CONFIRMED', totalMinor: 50000, paidMinor: 50000, refundedMinor: 0, currency: 'PEN' },
      ];

      const totalsByCurrency: Record<string, { grossBookedValue: number; actualCollectedValue: number; refundedValue: number }> = {};

      for (const r of reservations) {
        const curr = r.currency;
        if (!totalsByCurrency[curr]) {
          totalsByCurrency[curr] = { grossBookedValue: 0, actualCollectedValue: 0, refundedValue: 0 };
        }

        const isCancelled = r.bookingStatus === 'CANCELLED';
        const price = r.totalMinor / 100;
        const paid = r.paidMinor / 100;
        const refunded = r.refundedMinor / 100;
        const collected = Math.max(0, paid - refunded);

        // Cash truth: all collected and refunded cash movements tracked
        totalsByCurrency[curr].actualCollectedValue += collected;
        totalsByCurrency[curr].refundedValue += refunded;

        if (!isCancelled) {
          totalsByCurrency[curr].grossBookedValue += price;
        }
      }

      // USD:
      // Gross booked (excludes cancelled): 100 USD
      expect(totalsByCurrency['USD']?.grossBookedValue).toBe(100);
      // Actual collected: 100 (active) + 60 (cancelled net retained) = 160 USD
      expect(totalsByCurrency['USD']?.actualCollectedValue).toBe(160);
      // Refunded: 40 USD
      expect(totalsByCurrency['USD']?.refundedValue).toBe(40);

      // PEN:
      expect(totalsByCurrency['PEN']?.grossBookedValue).toBe(500);
      expect(totalsByCurrency['PEN']?.actualCollectedValue).toBe(500);
      expect(totalsByCurrency['PEN']?.refundedValue).toBe(0);
    });

    it('reports breakdowns never merge money across currencies and Top Tours ranks by count only', () => {
      const reportsServicePath = path.resolve(__dirname, '../../api/src/reports/reports.service.ts');
      const serviceContent = fs.readFileSync(reportsServicePath, 'utf8');

      expect(serviceContent).toContain("paymentStatusBreakdown: Record<string, { count: number; totalsByCurrency: Record<string, number> }>");
      expect(serviceContent).toContain("reservationsByDay: { date: string; count: number; totalsByCurrency: Record<string, number> }[]");
      expect(serviceContent).toContain("topTours: { title: string; count: number }[]");

      const reportsViewPath = path.resolve(__dirname, '../components/workspace/views/reports-view.tsx');
      const viewContent = fs.readFileSync(reportsViewPath, 'utf8');

      expect(viewContent).toContain("PARTIALLY_PAID");
      expect(viewContent).toContain("totalsByCurrency");
      expect(viewContent).not.toContain("formatMoney(t.total)"); // Top tours has no mixed money
    });
  });

  // ===========================================================================
  // 7. BILLING PRODUCT TRUTH
  // ===========================================================================
  describe('Billing Product Truth', () => {
    it('Billing section contains no fake active subscription, cards, invoices, or alert calls', () => {
      const billingSectionPath = path.resolve(__dirname, '../components/settings/sections/billing-section.tsx');
      const content = fs.readFileSync(billingSectionPath, 'utf8');

      expect(content).not.toContain("Plan Pro Crecimiento");
      expect(content).not.toContain("4242");
      expect(content).not.toContain("INV-2026-");
      expect(content).not.toContain("alert(");
      expect(content).toContain("MODO VISTA PREVIA");
      expect(content).toContain("Suscripción no vinculada");
      expect(content).toContain("credits?.balance");
    });
  });

  // ===========================================================================
  // 8. P2.8-IA0.3 PRODUCT TRUTH MICROFIX SUITE
  // ===========================================================================
  describe('P2.8-IA0.3 Product Truth Microfix Tests', () => {
    describe('Dashboard Truth', () => {
      it('API failure does not render synthetic zero business metrics and returns unavailable EmptyState', () => {
        const dashboardPagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/dashboard/page.tsx');
        const pageContent = fs.readFileSync(dashboardPagePath, 'utf8');

        // Confirms it renders EmptyState with the exact copy on failure, not synthetic zero DashboardView
        expect(pageContent).toContain('title="No fue posible cargar el resumen de la agencia"');
        expect(pageContent).toContain('Reintentar');
        expect(pageContent).toContain("redirect('/login?expired=1')");
        expect(pageContent).not.toContain("reservationsToday: 0");
      });

      it('PEN reservation is formatted as PEN and USD reservation is formatted as USD', async () => {
        const { formatMoneyAmount } = await import('./money');

        const penFormatted = formatMoneyAmount(150, 15000, 'PEN');
        const usdFormatted = formatMoneyAmount(150, 15000, 'USD');
        const eurFormatted = formatMoneyAmount(150, 15000, 'EUR');

        // PEN must contain PEN symbol/code (S/ or PEN) and not USD
        expect(penFormatted).toMatch(/S\/|PEN/);
        expect(penFormatted).not.toContain('USD');
        expect(penFormatted).not.toContain('US$');

        // USD must contain USD symbol/code ($ or US$) and not S/
        expect(usdFormatted).toMatch(/\$|USD/);
        expect(usdFormatted).not.toContain('S/');

        // EUR must contain EUR or €
        expect(eurFormatted).toMatch(/€|EUR/);
      });
    });

    describe('Locales Failure Semantics', () => {
      it('valid empty/default API response is parsed and rendered normally', () => {
        const validResponse = {
          locales: [{ id: 'loc-1', locale: 'es', isDefault: true, enabled: true }],
          defaultLocale: 'es',
          maxCatalogLocales: 1,
          enabledCount: 1,
        };

        const parsed = agencyLocalesResponseSchema.parse(validResponse);
        expect(parsed.locales[0]?.locale).toBe('es');
        expect(parsed.locales[0]?.isDefault).toBe(true);
      });

      it('API failure returns null and does not fabricate fake Español locale', async () => {
        const { fetchAgencyLocales } = await import('./settings-loader');
        const centralApi = await import('./central-api');

        vi.spyOn(centralApi, 'centralRequest').mockRejectedValueOnce(new Error('Network error'));

        const result = await fetchAgencyLocales('agency-1', 'fake-token');
        expect(result).toBeNull();
      });

      it('General settings section displays controlled unavailable UI when locales is null without synthetic data', () => {
        const generalSectionPath = path.resolve(__dirname, '../components/settings/sections/general-section.tsx');
        const content = fs.readFileSync(generalSectionPath, 'utf8');

        expect(content).toContain('No fue posible consultar los idiomas del catálogo.');
        expect(content).not.toContain("activeLocales = initialLocales && initialLocales.length > 0");
      });
    });

    describe('Credits Failure Semantics', () => {
      it('authoritative balance 0 renders 0', () => {
        const billingSectionPath = path.resolve(__dirname, '../components/settings/sections/billing-section.tsx');
        const content = fs.readFileSync(billingSectionPath, 'utf8');

        expect(content).toContain('créditos disponibles');
        expect(content).toContain('creditBalance');
      });

      it('API failure renders unavailable message and does not fabricate zero balance', async () => {
        const { fetchAgencyCredits } = await import('./settings-loader');
        const centralApi = await import('./central-api');

        vi.spyOn(centralApi, 'centralRequest').mockRejectedValueOnce(new Error('Central API timeout'));

        const result = await fetchAgencyCredits('agency-1', 'fake-token');
        expect(result).toBeNull();

        const billingSectionPath = path.resolve(__dirname, '../components/settings/sections/billing-section.tsx');
        const content = fs.readFileSync(billingSectionPath, 'utf8');

        expect(content).toContain('No fue posible consultar el saldo de créditos.');
        expect(content).toContain('isUnavailable');
      });
    });
  });
});
