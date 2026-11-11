import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { Button, EmptyState } from '@/shared/ui'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you are looking for does not exist or was moved."
      action={
        <Button asChild variant="secondary">
          <Link to="/">Back to home</Link>
        </Button>
      }
      className="mt-16"
    />
  )
}
