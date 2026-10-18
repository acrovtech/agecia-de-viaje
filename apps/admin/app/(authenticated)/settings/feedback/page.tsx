import React from 'react';
import { redirect } from 'next/navigation';
import { isApiAdmin } from '@/lib/admin-mode';
import { centralSession, CentralApiError } from '@/lib/central-api';
import { FeedbackSection } from '@/components/settings/sections/feedback-section';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  if (!isApiAdmin()) {
    redirect('/');
  }

  try {
    await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    throw error;
  }

  return <FeedbackSection />;
}
