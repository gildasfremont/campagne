import { Suspense } from 'react';
import NouveauSejourForm from '@/components/NouveauSejourForm';

export default function NouveauSejourPage() {
  return (
    <Suspense fallback={null}>
      <NouveauSejourForm />
    </Suspense>
  );
}
