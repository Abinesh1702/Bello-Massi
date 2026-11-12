import { SearchX, ArrowLeft } from 'lucide-react'
import Card from './Card'
import EmptyState from './EmptyState'
import Button from './Button'

/** Shown when a detail/edit URL points at a record that was deleted or never existed. */
export default function NotFoundRecord({ entity = 'record', backTo, backLabel = 'Back to list' }) {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title={`This ${entity} could not be found`}
        description={`It may have been deleted, or the link is incorrect.`}
        action={<Button icon={ArrowLeft} to={backTo}>{backLabel}</Button>}
      />
    </Card>
  )
}
