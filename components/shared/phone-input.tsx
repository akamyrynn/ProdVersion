"use client"

import { useState, useCallback } from "react"

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  // Remove leading 7 or 8
  const clean = digits.startsWith("7") ? digits.slice(1) : digits.startsWith("8") ? digits.slice(1) : digits

  let result = "+7"
  if (clean.length > 0) result += " (" + clean.slice(0, 3)
  if (clean.length >= 3) result += ") "
  if (clean.length > 3) result += clean.slice(3, 6)
  if (clean.length > 6) result += "-" + clean.slice(6, 8)
  if (clean.length > 8) result += "-" + clean.slice(8, 10)

  return result
}

function getRawPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, "")
  return digits.startsWith("7") ? "+" + digits : "+7" + digits
}

interface PhoneInputProps {
  name?: string
  required?: boolean
  className?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export default function PhoneInput({
  name = "phone",
  required = false,
  className,
  placeholder = "+7 (___) ___-__-__",
  value: controlledValue,
  onChange,
}: PhoneInputProps) {
  const [display, setDisplay] = useState(() =>
    controlledValue ? formatPhone(controlledValue) : ""
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setDisplay(formatted)
    onChange?.(getRawPhone(formatted))
  }, [onChange])

  const handleFocus = useCallback(() => {
    if (!display) setDisplay("+7 (")
  }, [display])

  const handleBlur = useCallback(() => {
    if (display === "+7 (" || display === "+7") setDisplay("")
  }, [display])

  return (
    <>
      <input
        type="tel"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        required={required}
        maxLength={18}
      />
      <input type="hidden" name={name} value={display ? getRawPhone(display) : ""} />
    </>
  )
}
