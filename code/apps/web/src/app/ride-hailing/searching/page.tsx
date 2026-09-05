'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OngoingExperience from '@/features/passenger-trip/ongoing-experience';
function SearchingContent() { const params = useSearchParams(); return <OngoingExperience tripId={params.get('tripId')} />; }
export default function RideHailingSearchingPage() { return <Suspense fallback={<div className="h-[calc(100dvh-3rem)] animate-pulse bg-muted" />}><SearchingContent /></Suspense>; }
