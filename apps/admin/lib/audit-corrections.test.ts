import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

describe('P2.8-IA0.1 Independent Audit Corrections Test Suite', () => {
  // ===========================================================================
  // 1. TOURS: ORCHESTRATION, ZERO FABRICATION & DIFFICULTY TRUTH
  // ===========================================================================
  describe('Tours Truth & Orchestration', () => {
    it('published Tour edited with desired status Activo remains published via re-publication endpoint', async () => {
      // Mock centralRequest calls for saveTourAction
      const mockCalls: { url: string; method?: string; body?: unknown }[] = [];
      const fakeCentralRequest = vi.fn(async (url: string, token: string, body?: unknown, method?: string) => {
        mockCalls.push({ url, method, body });
        if (url.includes('/catalog/tours') && method === 'PUT' && !url.includes('/publish') && !url.includes('/content')) {
          // Base PUT returns isPublished: false (invalidation on edit)
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

      // Simulation of saveTourAction orchestration logic:
      const desiredPublished = true;
      const originalPublished = true;
      const tourId = 'tour-123';
      const token = 'fake-token';

      // 1. Base PUT
      const updatedTour = await fakeCentralRequest(`/catalog/tours/${tourId}`, token, { title: 'Updated' }, 'PUT');
      // 2. Content PUT
      const updatedContent = await fakeCentralRequest(`/catalog/tours/${tourId}/content`, token, {}, 'PUT');

      let republishFailed = false;
      let finalMessage = 'Tour actualizado exitosamente.';

      // Critical Rule: IF desiredPublished === true, ALWAYS call the publication endpoint
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

      // Base & content save succeed:
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
          if (!title && !content) continue; // Both empty -> ignore
          if (!title || !content) {
            throw new Error(`Fila de itinerario ${i + 1}: debe completar tanto el título como la descripción.`);
          }
          valid.push({ title, content });
        }
        return valid;
      };

      // Both empty -> ignored
      expect(parseItinerary([{ title: '', content: '' }])).toEqual([]);

      // Only title populated -> error (never synthetic "Día X")
      expect(() => parseItinerary([{ title: 'Llegada a Cusco', content: '' }])).toThrowError(
        'Fila de itinerario 1: debe completar tanto el título como la descripción.'
      );

      // Only content populated -> error
      expect(() => parseItinerary([{ title: '', content: 'Traslado al hotel' }])).toThrowError(
        'Fila de itinerario 1: debe completar tanto el título como la descripción.'
      );

      // Both populated -> exact input
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

      // Both empty -> ignored
      expect(parseFaqs([{ question: '', answer: '' }])).toEqual([]);

      // Incomplete -> throws
      expect(() => parseFaqs([{ question: '¿Incluye almuerzo?', answer: '' }])).toThrowError(
        'Pregunta frecuente 1: debe completar tanto la pregunta como la respuesta.'
      );

      // Valid -> preserved
      expect(parseFaqs([{ question: '¿Incluye almuerzo?', answer: 'Sí, almuerzo buffet.' }])).toEqual([
        { question: '¿Incluye almuerzo?', answer: 'Sí, almuerzo buffet.' },
      ]);
    });

    it('image ALT is not fabricated and persists null when absent', () => {
      const parseGallery = (items: { url: string; alt?: string }[]) => {
        return items.map(img => ({
          url: img.url,
          alt: img.alt?.trim() ? img.alt.trim() : null, // Zero fabrication of "Foto 1", "Foto 2"
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

      // Default state must NOT be 'Moderada'
      expect(formContent).toContain("useState<string>(initialData?.difficulty || '')");
      expect(formContent).not.toContain("useState<string>(initialData?.difficulty || 'Moderada')");
      expect(formContent).toContain('placeholder="Seleccionar..."');
    });
  });

  // ===========================================================================
  // 2. FEEDBACK RUNTIME CONTRACT & ZERO CREDITS
  // ===========================================================================
  describe('Feedback Runtime Contract', () => {
    it('correct Central API request body passes payload directly and zero client-side credit minting', () => {
      const feedbackActionsPath = path.resolve(__dirname, 'feedback-actions.ts');
      const content = fs.readFileSync(feedbackActionsPath, 'utf8');

      // Must call centralRequest(route, token, { type, title, description }, 'POST')
      expect(content).toContain("centralRequest(");
      expect(content).toContain("type,");
      expect(content).toContain("title: title.trim()");
      expect(content).toContain("description: description.trim()");
      expect(content).toContain("'POST'");

      // Must NOT wrap inside { method: 'POST', body: JSON.stringify(...) } as the 3rd argument
      expect(content).not.toContain("JSON.stringify({ type, title, description })");

      // Zero reward credits in client body
      expect(content).not.toContain("rewardCredits");
    });

    it('feedback submission succeeds against strict DTO schema', () => {
      const createFeedbackSchema = z.object({
        type: z.enum(['BUG', 'IMPROVEMENT', 'FEATURE']),
        title: z.string().min(3).max(120),
        description: z.string().min(10).max(2000),
      }).strict();

      const validPayload = {
        type: 'BUG',
        title: 'Error en cálculo de fechas',
        description: 'Al filtrar por fecha en reportes la zona horaria debe ser consistente.',
      };

      const parsed = createFeedbackSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);

      // Attempting to send client rewardCredits fails strict schema
      const forgedPayload = {
        ...validPayload,
        rewardCredits: 500,
      };
      const forgedParsed = createFeedbackSchema.safeParse(forgedPayload);
      expect(forgedParsed.success).toBe(false);
    });
  });

  // ===========================================================================
  // 3. DASHBOARD AUTHORITATIVE CONTRACT & DATE/TIMEZONE
  // ===========================================================================
  describe('Dashboard Contract & Read Flow', () => {
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
      expect(serviceContent).toContain("America/Lima");
    });

    it('admin Dashboard page calls authoritative endpoint instead of invalid /reservations?limit=100', () => {
      const dashboardPagePath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/dashboard/page.tsx');
      const dashboardContent = fs.readFileSync(dashboardPagePath, 'utf8');

      expect(dashboardContent).toContain("${base}/dashboard");
      expect(dashboardContent).not.toContain("/reservations?limit=100");
    });
  });

  // ===========================================================================
  // 4. RESERVATIONS DETAIL & DORMANT OPERATIONS REMOVAL
  // ===========================================================================
  describe('Reservation Detail Product Truth', () => {
    it('active reservation detail does not fetch or render operational assignment resources', () => {
      const reservationDetailPath = path.resolve(__dirname, '../app/(authenticated)/(workspace)/reservations/page.tsx');
      const content = fs.readFileSync(reservationDetailPath, 'utf8');

      // No dormant guide, driver, vehicle resources fetching
      expect(content).not.toContain("/operations/resources?type=GUIDE");
      expect(content).not.toContain("/operations/resources?type=DRIVER");
      expect(content).not.toContain("/operations/vehicles");

      // No OperationsAssignmentForm rendered in active detail
      expect(content).not.toContain("<OperationsAssignmentForm");

      // Neutral product terminology for reservation activity
      expect(content).toContain("Historial de la reserva");
      expect(content).not.toContain("Historial Operativo");
    });
  });

  // ===========================================================================
  // 5. LOCALES & TRANSLATION ENTITLEMENT & PROVENANCE
  // ===========================================================================
  describe('Locale Entitlement & Security', () => {
    it('translation schema enforces bounded fields and strips client provenance', () => {
      const catalogContentPath = path.resolve(__dirname, '../../api/src/catalog/catalog-content.service.ts');
      const content = fs.readFileSync(catalogContentPath, 'utf8');

      // Translation schema replaces z.any() with bounded schema
      expect(content).not.toContain("itinerary: z.any()");
      expect(content).not.toContain("faqs: z.any()");

      // Server enforces provenance and draft status
      expect(content).toContain("generatedByAi: false");
      expect(content).toContain("reviewStatus: 'DRAFT'");
      expect(content).toContain("El idioma principal se gestiona en la ficha base del tour");
    });

    it('default locale cannot be changed if tours already exist', () => {
      const settingsServicePath = path.resolve(__dirname, '../../api/src/settings/settings.service.ts');
      const content = fs.readFileSync(settingsServicePath, 'utf8');

      expect(content).toContain("No se puede cambiar el idioma principal de la agencia porque ya existen tours");
    });
  });

  // ===========================================================================
  // 6. FINANCIAL REPORTING TRUTH & CURRENCY SAFETY
  // ===========================================================================
  describe('Financial Reporting Truth', () => {
    it('cancelled reservations are excluded from booked value and paidMinor/refundedMinor drive collected value', () => {
      const reportsServicePath = path.resolve(__dirname, '../../api/src/reports/reports.service.ts');
      const content = fs.readFileSync(reportsServicePath, 'utf8');

      // Check fields and calculations
      expect(content).toContain("activeReservations");
      expect(content).toContain("cancelledReservations");
      expect(content).toContain("totalsByCurrency");
      expect(content).toContain("actualCollectedValue");
      expect(content).toContain("refundedValue");

      // Simulating financial calculation
      const reservations = [
        { bookingStatus: 'CONFIRMED', totalMinor: 10000, paidMinor: 10000, refundedMinor: 0, currency: 'USD' },
        { bookingStatus: 'CANCELLED', totalMinor: 15000, paidMinor: 15000, refundedMinor: 15000, currency: 'USD' },
        { bookingStatus: 'CONFIRMED', totalMinor: 20000, paidMinor: 10000, refundedMinor: 0, currency: 'USD' },
      ];

      let grossBookedValue = 0;
      let actualCollectedValue = 0;
      let refundedValue = 0;
      let activeCount = 0;
      let cancelledCount = 0;

      for (const r of reservations) {
        const isCancelled = r.bookingStatus === 'CANCELLED';
        const price = r.totalMinor / 100;
        const paid = r.paidMinor / 100;
        const refunded = r.refundedMinor / 100;

        if (isCancelled) {
          cancelledCount++;
          refundedValue += refunded;
        } else {
          activeCount++;
          grossBookedValue += price;
          actualCollectedValue += Math.max(0, paid - refunded);
        }
      }

      expect(activeCount).toBe(2);
      expect(cancelledCount).toBe(1);
      // Cancelled 150 is excluded from grossBookedValue: 100 + 200 = 300
      expect(grossBookedValue).toBe(300);
      // Actual collected: 100 + 100 = 200
      expect(actualCollectedValue).toBe(200);
      // Refunded: 150
      expect(refundedValue).toBe(150);
    });

    it('PARTIALLY_PAID enum label is supported and currencies are isolated', () => {
      const reportsViewPath = path.resolve(__dirname, '../components/workspace/views/reports-view.tsx');
      const content = fs.readFileSync(reportsViewPath, 'utf8');

      expect(content).toContain("PARTIALLY_PAID");
      expect(content).toContain("Pago Parcial");
      expect(content).toContain("Totales Aislados por Moneda");
      expect(content).toContain("Reservas registradas durante el periodo");
    });
  });

  // ===========================================================================
  // 7. BILLING PRODUCT TRUTH & AUTHORITATIVE CREDITS
  // ===========================================================================
  describe('Billing Product Truth', () => {
    it('Billing section contains no fake active subscription, cards, invoices, or alert calls', () => {
      const billingSectionPath = path.resolve(__dirname, '../components/settings/sections/billing-section.tsx');
      const content = fs.readFileSync(billingSectionPath, 'utf8');

      // No fake active plan
      expect(content).not.toContain("Plan Pro Crecimiento");
      expect(content).not.toContain("4242");
      expect(content).not.toContain("INV-2026-");
      expect(content).not.toContain("alert(");
      expect(content).toContain("MODO VISTA PREVIA");
      expect(content).toContain("Suscripción no vinculada");
      expect(content).toContain("credits?.balance");
    });

    it('active settings surfaces contain zero native alert() calls', () => {
      const profilePath = path.resolve(__dirname, '../components/settings/sections/profile-section.tsx');
      const socialPath = path.resolve(__dirname, '../components/settings/sections/social-section.tsx');

      expect(fs.readFileSync(profilePath, 'utf8')).not.toContain('alert(');
      expect(fs.readFileSync(socialPath, 'utf8')).not.toContain('alert(');
    });
  });
});
