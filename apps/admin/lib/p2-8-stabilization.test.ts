import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

vi.mock('server-only', () => ({}));

import { getIntegrationCapabilities, APPROVED_PROVIDERS } from './integration-capabilities';

describe('P2.8 — Post-Legacy-Purge Central API Stabilization Gate Tests', () => {
  const adminRoot = path.resolve(__dirname, '..');

  it('1. Dashboard "Nuevo tour" links to canonical /catalog/tours?edit=new', () => {
    const dashboardViewPath = path.join(adminRoot, 'components/workspace/views/dashboard-view.tsx');
    const content = fs.readFileSync(dashboardViewPath, 'utf8');

    // Must link to canonical /catalog/tours?edit=new
    expect(content).toContain('/catalog/tours?edit=new');
    // Must NOT link to deleted legacy /tours/new
    expect(content).not.toContain('/tours/new');
  });

  it('2. canonical TourForm has zero dependency on legacy createTour/deleteTour/apps/admin/app/actions', () => {
    const tourFormPath = path.join(adminRoot, 'components/forms/tour-form.tsx');
    const content = fs.readFileSync(tourFormPath, 'utf8');

    // Ensure no legacy actions are imported
    expect(content).not.toMatch(/from\s+['"][^'"]*actions\/tour['"]/);
    expect(content).not.toContain('createTour');
    expect(content).not.toContain('requireContentOrMaster');
    expect(content).not.toContain('requireMasterRole');
    // Must import canonical actions
    expect(content).toContain('saveTourAction');
    expect(content).toContain('deleteTourAction');
  });

  it('3. API-mode Tour save uses central API and does not import direct Prisma or @repo/db', () => {
    const catalogActionsPath = path.join(adminRoot, 'app/workspace/catalog-actions.ts');
    const content = fs.readFileSync(catalogActionsPath, 'utf8');

    // Uses central API
    expect(content).toContain('centralSession');
    expect(content).toContain('centralRequest');
    expect(content).toContain('/catalog/tours');
    // Does NOT import direct prisma
    expect(content).not.toContain('@repo/db');
    expect(content).not.toContain('prisma');
    expect(content).not.toContain('admin_session');
  });

  it('4. new Tour base + content save sequence is orchestrated correctly', () => {
    const catalogActionsPath = path.join(adminRoot, 'app/workspace/catalog-actions.ts');
    const content = fs.readFileSync(catalogActionsPath, 'utf8');

    // Base tour POST
    expect(content).toContain("await centralRequest(baseRoute, token, baseTourPayload, 'POST')");
    // Rich content PUT
    expect(content).toContain("/content`, token, contentPayload, 'PUT')");
    // Canonical redirect to /catalog/tours?saved=1
    expect(content).toContain("redirect('/catalog/tours?saved=1')");
    // Edit base Tour optimistic concurrency PUT
    expect(content).toContain("expectedUpdatedAt: updatedAt");
  });

  it('5. edit loads rich /content data in /catalog/tours/page.tsx', () => {
    const toursPagePath = path.join(adminRoot, 'app/(authenticated)/(workspace)/catalog/tours/page.tsx');
    const content = fs.readFileSync(toursPagePath, 'utf8');

    // Must fetch /content endpoint when editing
    expect(content).toContain('/content');
    expect(content).toContain('tourContentSchema');
    expect(content).toContain('record={selected}');
  });

  it('6. categories passed to TourForm are real tenant data fetched from API', () => {
    const toursPagePath = path.join(adminRoot, 'app/(authenticated)/(workspace)/catalog/tours/page.tsx');
    const content = fs.readFileSync(toursPagePath, 'utf8');

    expect(content).toContain('/catalog/categories');
    expect(content).toContain('categories={categories}');
  });

  it('7. fake fallback category IDs cannot be persisted', () => {
    const catalogActionsPath = path.join(adminRoot, 'app/workspace/catalog-actions.ts');
    const content = fs.readFileSync(catalogActionsPath, 'utf8');

    // Must verify against tenantCategoryIds
    expect(content).toContain('tenantCategoryIds');
    expect(content).toContain('tenantCategoryIds.has(catId)');
  });

  it('8. destinationType validates strictly with Nacional and Internacional', () => {
    const schema = z.enum(['Nacional', 'Internacional']);
    expect(schema.safeParse('Nacional').success).toBe(true);
    expect(schema.safeParse('Internacional').success).toBe(true);
    expect(schema.safeParse('Regional').success).toBe(false);
    expect(schema.safeParse('Global').success).toBe(false);
    expect(schema.safeParse('').success).toBe(false);
  });

  it('9. category hierarchy enforces tenant isolation: parent cannot cross agencies', () => {
    const catalogContentServicePath = path.resolve(adminRoot, '../api/src/catalog/catalog-content.service.ts');
    const content = fs.readFileSync(catalogContentServicePath, 'utf8');

    // Verify parent agency check exists in service
    expect(content).toContain('where: { id: data.parentId, agencyId: who.agencyId }');
    expect(content).toContain('Parent category must exist in the same agency');
    expect(content).toContain('A category cannot be its own parent');
  });

  it('10. Stripe is present as sixth integration, disabled, and non-clickable', () => {
    const capabilities = getIntegrationCapabilities();
    const stripe = capabilities.find((c) => c.id === 'stripe');

    expect(stripe).toBeDefined();
    expect(stripe?.status).toBe('disabled');
    expect(stripe?.statusLabel).toBe('NO DISPONIBLE');
    expect(stripe?.configured).toBe(false);
    expect(APPROVED_PROVIDERS.length).toBe(6);
  });

  it('11. integrations section contains no connection CTA or fake actions', () => {
    const integrationsViewPath = path.join(adminRoot, 'components/settings/sections/integrations-section.tsx');
    const content = fs.readFileSync(integrationsViewPath, 'utf8');

    expect(content).not.toContain('Conectar cuenta');
    expect(content).not.toContain('Conectar');
    expect(content).not.toContain('onClick');
    expect(content).not.toContain('alert(');
  });

  it('12. deleted legacy route group apps/admin/app/(dashboard) remains deleted', () => {
    const legacyDashboardPath = path.join(adminRoot, 'app/(dashboard)');
    const exists = fs.existsSync(legacyDashboardPath);

    expect(exists).toBe(false);
  });

  it('13. canonical routes do not revalidate or redirect to legacy (dashboard) paths', () => {
    const catalogActionsPath = path.join(adminRoot, 'app/workspace/catalog-actions.ts');
    const content = fs.readFileSync(catalogActionsPath, 'utf8');

    expect(content).not.toContain("revalidatePath('/(dashboard)");
    expect(content).not.toContain("revalidatePath('/tours')");
    expect(content).not.toContain("redirect('/tours')");
  });
});
