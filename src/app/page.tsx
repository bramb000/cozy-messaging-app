import { redirect } from 'next/navigation'

// Root redirects to chat
export default function Home() {
  redirect('/chat')
}
