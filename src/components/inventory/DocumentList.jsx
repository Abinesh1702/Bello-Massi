import PageHeader from '../common/PageHeader'
import Card from '../common/Card'
import Button from '../common/Button'
import { Plus } from 'lucide-react'

/** Shared shell for receipt / transfer / adjustment list pages. */
export default function DocumentList({ title, description, createTo, createLabel, canCreate, kpis, children }) {
  return (
    <>
      <PageHeader title={title} description={description} actions={canCreate && <Button icon={Plus} to={createTo}>{createLabel}</Button>} />
      {kpis}
      <Card className={kpis ? 'mt-6' : ''}>{children}</Card>
    </>
  )
}
