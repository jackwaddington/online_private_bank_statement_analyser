import styled from 'styled-components'

interface Props {
  categories: string[]
}

export function CategoriesUsed({ categories }: Props) {
  return (
    <Wrapper>
      <CategoriesTitle>Categories used:</CategoriesTitle>
      <CategoryTags>
        {categories.map(cat => (
          <CategoryTag key={cat}>{cat}</CategoryTag>
        ))}
      </CategoryTags>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const CategoriesTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const CategoryTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const CategoryTag = styled.span`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSize.xs};
`
