'use client';

import { CatalogEditor } from '../../components/workspace/catalog-editor';
import type { CatalogDetail, CatalogKind } from '../../lib/catalog-editor';

export function CatalogForm({ kind, record }: { kind: CatalogKind; record?: CatalogDetail }) {
  return <CatalogEditor kind={kind} record={record} />;
}
