'use client';

import React from 'react';
import { AppShell } from '@/components/design-system/app-shell';
import { SettingsSidebar } from '@/components/design-system/settings-sidebar';
import type { NavIdentity } from '@/components/design-system/sidebar';

export interface SettingsShellProps {
  identity: NavIdentity;
  children: React.ReactNode;
}

export function SettingsShell({ identity, children }: SettingsShellProps) {
  return (
    <AppShell
      identity={identity}
      sidebar={({ onNavigate }) => (
        <SettingsSidebar identity={identity} onNavigate={onNavigate} />
      )}
    >
      <div className="max-w-[48rem] mx-auto w-full settings-tabs-wrapper">
        {children}
      </div>
    </AppShell>
  );
}
