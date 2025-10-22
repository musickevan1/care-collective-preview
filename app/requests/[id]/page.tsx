/**
 * @fileoverview Legacy Request Detail Page - Redirects to Modal View
 * This page now redirects to the list page with modal open
 * Maintains backward compatibility for old /requests/[id] links
 */

import { redirect } from 'next/navigation'

interface PageProps {
  params: { id: string }
}

/**
 * Redirect to list page with modal open
 * This maintains backward compatibility for old /requests/[id] links
 */
export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = params

  // Redirect to list page with modal open
  redirect(`/requests?id=${id}`)
}
