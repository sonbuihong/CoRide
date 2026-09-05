import OngoingExperience from '@/features/passenger-trip/ongoing-experience';
export default function RideHailingTripPage({ params }: { params: { id: string } }) { return <OngoingExperience tripId={params.id} />; }
