'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OngoingExperience from '@/features/passenger-trip/ongoing-experience';

function OngoingContent() {
  const searchParams = useSearchParams();
  return <OngoingExperience tripId={searchParams.get('tripId')} />;
}

export default function OngoingPage() {
  return <Suspense fallback={<div className="h-[calc(100dvh-48px)] bg-[#edf1eb]" />}><OngoingContent /></Suspense>;
}
