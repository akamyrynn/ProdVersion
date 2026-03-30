"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface Suggestion {
  value: string
  unrestricted: string
}

interface AddressInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  city?: string
}

export default function AddressInput({ value = "", onChange, placeholder, className, city }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    try {
      const res = await fetch("/api/dadata/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, city }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setShowDropdown(true)
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange?.(val)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }, [onChange, fetchSuggestions])

  const handleSelect = useCallback((suggestion: Suggestion) => {
    onChange?.(suggestion.value)
    setSuggestions([])
    setShowDropdown(false)
  }, [onChange])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
            >
              {s.value}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
