import { FilterSkeleton, MacroGridSkeleton } from '../../../../components/Skeleton'

export default function MacrosLoading() {
  return (
    <div className="container-page">
      <FilterSkeleton />
      <MacroGridSkeleton />
    </div>
  )
}
