"use client"

import * as React from "react"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Render a placeholder or nothing on the server to avoid hydration mismatch
    return <Switch disabled id="theme-switch-placeholder" />
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <Switch
      id="theme-switch"
      checked={isDark}
      onCheckedChange={toggleTheme}
      aria-label="Toggle theme"
    />
  )
}
