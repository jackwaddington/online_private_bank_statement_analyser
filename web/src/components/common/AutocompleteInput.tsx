import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  suggestions: string[]
  placeholder?: string
  autoFocus?: boolean
}

export function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  suggestions,
  placeholder = 'Type a category...',
  autoFocus = false,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter suggestions based on input
  const filteredSuggestions = value.trim()
    ? suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      )
    : suggestions

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  const handleSelect = (suggestion: string) => {
    onChange(suggestion)
    onSubmit(suggestion)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault()
        onSubmit(value.trim())
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(filteredSuggestions[highlightedIndex])
        } else if (value.trim()) {
          onSubmit(value.trim())
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <Container>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={isOpen && filteredSuggestions.length > 0}
        aria-controls="autocomplete-list"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <SuggestionList
          ref={listRef}
          id="autocomplete-list"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion}
              role="option"
              aria-selected={index === highlightedIndex}
              $highlighted={index === highlightedIndex}
              onMouseDown={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion}
            </SuggestionItem>
          ))}
        </SuggestionList>
      )}
    </Container>
  )
}

const Container = styled.div`
  position: relative;
  width: 100%;
`

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const SuggestionList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: ${({ theme }) => theme.spacing.xs} 0 0 0;
  padding: 0;
  list-style: none;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
`

const SuggestionItem = styled.li<{ $highlighted: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  background: ${({ $highlighted, theme }) =>
    $highlighted ? theme.colors.primaryLight : 'transparent'};
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`
