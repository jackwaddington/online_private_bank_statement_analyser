import { CategoryDetailChart } from '../../charts'
import {
  Section,
  CollapsibleHeader,
  SectionTitle,
  ToggleIcon,
  CollapsibleContent,
} from './styles'
import type { MonthlySpending } from '../../../core/types/report'

interface Props {
  sortedCategories: [string, number][]
  monthlySpending: MonthlySpending[]
  isOpen: boolean
  onToggle: () => void
}

export function CategoryDetailsSection({
  sortedCategories,
  monthlySpending,
  isOpen,
  onToggle,
}: Props) {
  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Category Details (Last 12 Months)
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
        <CollapsibleContent>
          {sortedCategories.map(([category]) => (
            <CategoryDetailChart
              key={category}
              category={category}
              monthlySpending={monthlySpending}
            />
          ))}
        </CollapsibleContent>
      )}
    </Section>
  )
}
