import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: ${({ theme }) => theme.fontSize.base};
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    line-height: 1.25;
  }

  h1 { font-size: ${({ theme }) => theme.fontSize.xxxl}; }
  h2 { font-size: ${({ theme }) => theme.fontSize.xxl}; }
  h3 { font-size: ${({ theme }) => theme.fontSize.xl}; }

  p {
    margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }
  }

  button {
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  input, select, textarea {
    font-family: inherit;
    font-size: inherit;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`
