import Breadcrumbs from '../layout/Breadcrumbs'

/** Page title, mobile breadcrumbs and page-level actions. */
export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-5 sm:mb-6">
      <Breadcrumbs className="md:hidden mb-2" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-page-title sm:text-[1.5rem] sm:leading-8">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
