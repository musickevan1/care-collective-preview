import { redirect } from 'next/navigation'

// Redirect to notifications as the default settings tab
export default function SettingsPage() {
  redirect('/settings/notifications')
}
