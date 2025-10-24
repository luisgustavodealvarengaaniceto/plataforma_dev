'use client';

import TripReportModule from '../components/TripReportModule';

export default function TripsPage() {
  // TODO: Get IMEI from device store or route params
  const imei = '860112070135860';
  
  return (
    <div className="container mx-auto p-6">
      <TripReportModule imei={imei} />
    </div>
  );
}
