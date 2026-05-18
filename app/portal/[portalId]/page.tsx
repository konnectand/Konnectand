import { Suspense } from 'react'
import KioskApp from '@/components/KioskApp'

interface Props {
  params: { portalId: string }
}

export default function PortalPage({ params }: Props) {
  return (
    <Suspense>
      <KioskApp portalId={params.portalId} />
    </Suspense>
  )
}
