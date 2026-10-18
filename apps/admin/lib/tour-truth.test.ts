import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('server-only', () => ({}));

describe('P2.8 Commit A: Tour Truth and Correctness', () => {
  const adminRoot = path.resolve(__dirname, '..');
  const dbRoot = path.resolve(adminRoot, '../../packages/db');
  const apiRoot = path.resolve(adminRoot, '../../apps/api');

  it('1. new tour initializes to Desactivado (draft by default)', () => {
    const tourFormPath = path.join(adminRoot, 'components/forms/tour-form.tsx');
    const content = fs.readFileSync(tourFormPath, 'utf8');

    // Initialization checks initialData.id and isPublished truthfully
    expect(content).toContain("if (!initialData || !initialData.id) return 'Desactivado'");
    expect(content).toContain("return initialData.isPublished ? 'Activo' : 'Desactivado'");
  });

  it('2. zero fabricated tour data in saveTourAction', () => {
    const actionsPath = path.join(adminRoot, 'app/workspace/catalog-actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf8');

    expect(content).not.toContain("'Descripción del tour.'");
    expect(content).not.toContain("'1 día'");
    expect(content).not.toContain("'/tours/machu-picchu.webp'");
    expect(content).not.toContain("'Actividades programadas.'");
    expect(content).not.toContain("'Respuesta.'");
    expect(content).not.toContain('sharedPrice || 100');
    expect(content).not.toContain('${title} - Agencia de Viajes');
  });

  it('3. publication failure is surfaced truthfully and never swallowed', () => {
    const actionsPath = path.join(adminRoot, 'app/workspace/catalog-actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf8');

    expect(content).toContain('El tour se guardó como borrador, pero no pudo publicarse. Revisa los campos obligatorios.');
    expect(content).toContain('Los cambios se guardaron como borrador, pero no pudo publicarse el tour. Revisa los campos obligatorios.');
    expect(content).not.toContain('console.warn(\'Publication skipped/failed:\', pubErr)');
  });

  it('4. shared modality is not forced on in tour-form', () => {
    const tourFormPath = path.join(adminRoot, 'components/forms/tour-form.tsx');
    const content = fs.readFileSync(tourFormPath, 'utf8');

    // Only rendered conditionally when hasSharedService is true
    expect(content).toContain('{hasSharedService && <input type="hidden" name="hasSharedService" value="on" />}');
    expect(content).not.toMatch(/^\s*<input type="hidden" name="hasSharedService" value="on" \/>/m);
  });

  it('5. category management links to canonical /resources/categories', () => {
    const tourFormPath = path.join(adminRoot, 'components/forms/tour-form.tsx');
    const content = fs.readFileSync(tourFormPath, 'utf8');

    expect(content).not.toContain('href="/categories"');
    expect(content).toContain('href="/resources/categories"');
  });

  it('6. category hierarchy uses ON DELETE SET NULL to prevent cascade deletion of children', () => {
    const schemaPath = path.join(dbRoot, 'prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    expect(schemaContent).toContain('@relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)');

    const migrationPath = path.join(dbRoot, 'prisma/migrations/20261018010000_p2_8_product_ia_and_draft_truth/migration.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    expect(migrationContent).toContain('ON DELETE SET NULL ON UPDATE CASCADE');
  });

  it('7. TourForm contains zero native alert() calls', () => {
    const tourFormPath = path.join(adminRoot, 'components/forms/tour-form.tsx');
    const content = fs.readFileSync(tourFormPath, 'utf8');

    expect(content).not.toContain('alert(');
    expect(content).toContain('setDeleteError');
  });

  it('8. Central API publish endpoint strictly validates all storefront prerequisites', () => {
    const contentServicePath = path.join(apiRoot, 'src/catalog/catalog-content.service.ts');
    const content = fs.readFileSync(contentServicePath, 'utf8');

    expect(content).toContain('!row.title?.trim()');
    expect(content).toContain('!row.description?.trim()');
    expect(content).toContain('!row.duration?.trim()');
    expect(content).toContain('!image.safeParse(row.bannerImage).success');
    expect(content).toContain('!image.safeParse(row.cardImage).success');
    expect(content).toContain('(!row.hasSharedService && !row.hasPrivateService)');
  });
});
