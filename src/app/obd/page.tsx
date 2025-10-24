'use client';

import DiagnosticsModule from '../components/DiagnosticsModule';

export default function OBDPage() {
  // TODO: Get IMEI from device store or route params
  const imei = '860112070135860';
  
  return (
    <div className="container mx-auto p-6">
      <DiagnosticsModule imei={imei} />
    </div>
  );
}
