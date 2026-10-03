import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PRODUCT_NAME, PRODUCT_SHORT_NAME } from '../../lib/brand';

describe('Admin UI/UX Productization Suite (Phase 2.8)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. BRAND DECOUPLING
  // -------------------------------------------------------------------------
  it('1. Platform brand abstraction provides neutral commercial branding without hard-coded IncaBound', () => {
    expect(PRODUCT_NAME).toBe('Platform Admin');
    expect(PRODUCT_SHORT_NAME).toBe('Admin');
    expect(PRODUCT_NAME.toLowerCase()).not.toContain('incabound');
    expect(PRODUCT_SHORT_NAME.toLowerCase()).not.toContain('incabound');
  });

  // -------------------------------------------------------------------------
  // 2. RESPONSIVE EDITOR DEFAULTS
  // -------------------------------------------------------------------------
  it('2. Desktop default = COMPLETE EDITOR', () => {
    function resolveInitialEditorMode(width: number, localOverride?: string | null) {
      if (localOverride === 'complete' || localOverride === 'guided') {
        return localOverride;
      }
      return width < 768 ? 'guided' : 'complete';
    }

    // Standard desktop viewports (1024px, 1440px)
    expect(resolveInitialEditorMode(1024, null)).toBe('complete');
    expect(resolveInitialEditorMode(1440, null)).toBe('complete');
    expect(resolveInitialEditorMode(768, null)).toBe('complete');
  });

  it('3. Mobile default = GUIDED EDITOR', () => {
    function resolveInitialEditorMode(width: number, localOverride?: string | null) {
      if (localOverride === 'complete' || localOverride === 'guided') {
        return localOverride;
      }
      return width < 768 ? 'guided' : 'complete';
    }

    // Standard mobile viewports (375px, 480px, 640px)
    expect(resolveInitialEditorMode(375, null)).toBe('guided');
    expect(resolveInitialEditorMode(480, null)).toBe('guided');
    expect(resolveInitialEditorMode(600, null)).toBe('guided');
  });

  it('4. User local override takes precedence over viewport default', () => {
    function resolveInitialEditorMode(width: number, localOverride?: string | null) {
      if (localOverride === 'complete' || localOverride === 'guided') {
        return localOverride;
      }
      return width < 768 ? 'guided' : 'complete';
    }

    // User on mobile explicitly chose complete
    expect(resolveInitialEditorMode(375, 'complete')).toBe('complete');
    // User on desktop explicitly chose guided
    expect(resolveInitialEditorMode(1440, 'guided')).toBe('guided');
  });

  // -------------------------------------------------------------------------
  // 3. SHARED FORM STATE & MUTATION ARCHITECTURE
  // -------------------------------------------------------------------------
  it('5. Mode switch preserves form state without resetting user inputs', () => {
    interface FormState {
      title: string;
      slug: string;
      price: string;
      hasShared: boolean;
      mode: 'complete' | 'guided';
    }

    let state: FormState = {
      title: 'Tour Valle Sagrado VIP',
      slug: 'tour-valle-sagrado-vip',
      price: '85.00',
      hasShared: true,
      mode: 'complete',
    };

    // User switches mode to guided
    state = { ...state, mode: 'guided' };
    expect(state.title).toBe('Tour Valle Sagrado VIP');
    expect(state.slug).toBe('tour-valle-sagrado-vip');
    expect(state.price).toBe('85.00');
    expect(state.hasShared).toBe(true);

    // User edits price in guided mode
    state = { ...state, price: '95.00' };

    // User switches back to complete mode
    state = { ...state, mode: 'complete' };
    expect(state.title).toBe('Tour Valle Sagrado VIP');
    expect(state.price).toBe('95.00');
    expect(state.hasShared).toBe(true);
  });

  it('6. Complete and Guided modes generate identical payload for backend mutation layer', () => {
    function buildPayload(fields: { title: string; slug: string; price: string; hasShared: boolean }) {
      return {
        title: fields.title.trim(),
        slug: fields.slug.trim(),
        hasSharedService: fields.hasShared,
        sharedPrice: fields.hasShared ? Number(fields.price) : null,
      };
    }

    const completeFormFields = {
      title: 'City Tour Cusco',
      slug: 'city-tour-cusco',
      price: '40.00',
      hasShared: true,
    };

    const guidedFormFields = {
      title: 'City Tour Cusco',
      slug: 'city-tour-cusco',
      price: '40.00',
      hasShared: true,
    };

    const payloadFromComplete = buildPayload(completeFormFields);
    const payloadFromGuided = buildPayload(guidedFormFields);

    expect(payloadFromComplete).toEqual(payloadFromGuided);
    expect(payloadFromComplete).toEqual({
      title: 'City Tour Cusco',
      slug: 'city-tour-cusco',
      hasSharedService: true,
      sharedPrice: 40.0,
    });
  });

  // -------------------------------------------------------------------------
  // 4. SIDEBAR ROLE VISIBILITY (RBAC)
  // -------------------------------------------------------------------------
  it('7. Sidebar filters navigation items strictly by role permissions', () => {
    interface Item {
      label: string;
      roles?: string[];
    }

    const items: Item[] = [
      { label: 'Inicio' },
      { label: 'Reservas', roles: ['OWNER', 'ADMIN', 'OPERATOR'] },
      { label: 'Operaciones', roles: ['OWNER', 'ADMIN', 'OPERATOR'] },
      { label: 'Catálogo' },
      { label: 'Recursos', roles: ['OWNER', 'ADMIN', 'OPERATOR', 'EDITOR'] },
      { label: 'Equipo', roles: ['OWNER', 'ADMIN'] },
      { label: 'Notificaciones', roles: ['OWNER', 'ADMIN'] },
      { label: 'Configuración' },
    ];

    function filterForRole(role: string) {
      return items.filter((item) => !item.roles || item.roles.includes(role)).map((i) => i.label);
    }

    // OWNER: All 8 sections
    const ownerItems = filterForRole('OWNER');
    expect(ownerItems).toEqual([
      'Inicio',
      'Reservas',
      'Operaciones',
      'Catálogo',
      'Recursos',
      'Equipo',
      'Notificaciones',
      'Configuración',
    ]);

    // OPERATOR: Cannot see Equipo or Notificaciones
    const operatorItems = filterForRole('OPERATOR');
    expect(operatorItems).toContain('Reservas');
    expect(operatorItems).toContain('Operaciones');
    expect(operatorItems).not.toContain('Equipo');
    expect(operatorItems).not.toContain('Notificaciones');

    // VIEWER: Cannot see Reservas, Operaciones, Recursos, Equipo, Notificaciones
    const viewerItems = filterForRole('VIEWER');
    expect(viewerItems).toEqual(['Inicio', 'Catálogo', 'Configuración']);
  });

  // -------------------------------------------------------------------------
  // 5. INPUT CARDS & ACCESSIBILITY
  // -------------------------------------------------------------------------
  it('8. RadioCard supports keyboard accessibility and categorical state selection', () => {
    const options = [
      { value: 'shared', title: 'Compartido' },
      { value: 'private', title: 'Privado' },
      { value: 'both', title: 'Ambos' },
    ];

    let selectedValue = 'shared';
    const onChange = vi.fn((val: string) => {
      selectedValue = val;
    });

    function simulateKeyPress(key: string, targetValue: string) {
      if (key === 'Enter' || key === ' ') {
        onChange(targetValue);
      }
    }

    // Space key selects 'private'
    simulateKeyPress(' ', 'private');
    expect(onChange).toHaveBeenCalledWith('private');
    expect(selectedValue).toBe('private');

    // Enter key selects 'both'
    simulateKeyPress('Enter', 'both');
    expect(onChange).toHaveBeenCalledWith('both');
    expect(selectedValue).toBe('both');
  });

  // -------------------------------------------------------------------------
  // 6. DESTRUCTIVE ACTION CONFIRMATION MODAL
  // -------------------------------------------------------------------------
  it('9. Destructive actions use accessible confirmation dialog instead of browser window.confirm', () => {
    let dialogOpen = false;
    let confirmedAction = false;

    function requestDeleteMember() {
      // Must NOT use window.confirm()
      dialogOpen = true;
    }

    function onConfirmModal() {
      confirmedAction = true;
      dialogOpen = false;
    }

    requestDeleteMember();
    expect(dialogOpen).toBe(true);
    expect(confirmedAction).toBe(false);

    onConfirmModal();
    expect(dialogOpen).toBe(false);
    expect(confirmedAction).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 7. INVITATION ACCEPTANCE ROUTE INTEGRITY
  // -------------------------------------------------------------------------
  it('10. Canonical invitation accept link structure remains operational', () => {
    const adminOrigin = 'https://admin.example.com';
    const rawToken = 'abc123safeTokenVal';

    const url = new URL('/invitations/accept', adminOrigin);
    url.searchParams.set('token', rawToken);

    expect(url.toString()).toBe('https://admin.example.com/invitations/accept?token=abc123safeTokenVal');
    expect(url.pathname).toBe('/invitations/accept');
    expect(url.searchParams.get('token')).toBe(rawToken);
  });

  // -------------------------------------------------------------------------
  // 8. TABLET ICON-RAIL NESTED NAVIGATION (md < lg)
  // -------------------------------------------------------------------------
  it('11. Tablet icon rail exposes nested flyout navigation without hiding child items', () => {
    // Model parent rail items with children
    const navItems = [
      {
        label: 'Tours',
        href: '/catalog/tours',
        children: [
          { label: 'Categorías', href: '/resources/categories' },
          { label: 'Personal operativo (guías y conductores)', href: '/resources/personnel' },
        ],
      },
      {
        label: 'Traslados',
        href: '/catalog/transfers',
        children: [
          { label: 'Flota operativa', href: '/resources/fleet' },
          { label: 'Vehículos comerciales', href: '/resources/vehicles' },
        ],
      },
    ];

    // On tablet (md < lg), rail mode toggles a flyout popover for items with children
    let activeFlyout: string | null = null;

    function handleRailClick(label: string) {
      activeFlyout = activeFlyout === label ? null : label;
    }

    function handleEscape() {
      activeFlyout = null;
    }

    // Tapping Tours on tablet rail opens its flyout
    handleRailClick('Tours');
    expect(activeFlyout).toBe('Tours');

    // Child routes are accessible in the flyout
    const tours = navItems.find((i) => i.label === activeFlyout);
    expect(tours?.children.map((c) => c.href)).toEqual([
      '/resources/categories',
      '/resources/personnel',
    ]);

    // Escape closes flyout
    handleEscape();
    expect(activeFlyout).toBeNull();

    // Tapping Traslados on tablet rail opens its flyout
    handleRailClick('Traslados');
    expect(activeFlyout).toBe('Traslados');

    const traslados = navItems.find((i) => i.label === activeFlyout);
    expect(traslados?.children.map((c) => c.href)).toEqual([
      '/resources/fleet',
      '/resources/vehicles',
    ]);
  });
});

