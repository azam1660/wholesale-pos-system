"use client"

import dynamic from 'next/dynamic'

// Use dynamic import with no SSR for the InventoryManagement component
const InventoryManagement = dynamic(
  () => import('@/components/inventory-management'),
  { ssr: false }
)

export default function InventoryPage() {
  return <InventoryManagement />
}
