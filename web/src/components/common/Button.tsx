import styled, { css } from 'styled-components'

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'outline'
  $size?: 'sm' | 'md' | 'lg'
  $fullWidth?: boolean
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  transition: all ${({ theme }) => theme.transitions.fast};
  text-decoration: none;

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  /* Size variants */
  ${({ $size = 'md', theme }) => {
    switch ($size) {
      case 'sm':
        return css`
          padding: ${theme.spacing.xs} ${theme.spacing.sm};
          font-size: ${theme.fontSize.sm};
        `
      case 'lg':
        return css`
          padding: ${theme.spacing.md} ${theme.spacing.xl};
          font-size: ${theme.fontSize.lg};
        `
      default:
        return css`
          padding: ${theme.spacing.sm} ${theme.spacing.lg};
          font-size: ${theme.fontSize.base};
        `
    }
  }}

  /* Color variants */
  ${({ $variant = 'primary', theme }) => {
    switch ($variant) {
      case 'secondary':
        return css`
          background: ${theme.colors.surface};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};

          &:hover:not(:disabled) {
            background: ${theme.colors.border};
          }
        `
      case 'outline':
        return css`
          background: transparent;
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.primary};

          &:hover:not(:disabled) {
            background: ${theme.colors.primaryLight};
          }
        `
      default:
        return css`
          background: ${theme.colors.primary};
          color: ${theme.colors.textInverse};

          &:hover:not(:disabled) {
            background: ${theme.colors.primaryHover};
          }
        `
    }
  }}
`
