import { useState, useEffect } from "react"

export type DeviceType = "mobile" | "tablet" | "laptop" | "desktop"

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isLaptop: boolean
  isDesktop: boolean
  deviceType: DeviceType
  width: number
  height: number
}

/**
 * Custom hook for responsive design across all device types
 * Breakpoints:
 * - Mobile: < 640px (sm)
 * - Tablet: 640px - 1024px (sm to lg)
 * - Laptop: 1024px - 1280px (lg to xl)
 * - Desktop: >= 1280px (xl+)
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isLaptop: false,
    isDesktop: false,
    deviceType: "mobile",
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      const isMobile = width < 640 // sm breakpoint
      const isTablet = width >= 640 && width < 1024 // sm to lg
      const isLaptop = width >= 1024 && width < 1280 // lg to xl
      const isDesktop = width >= 1280 // xl+

      let deviceType: DeviceType = "mobile"
      if (isDesktop) deviceType = "desktop"
      else if (isLaptop) deviceType = "laptop"
      else if (isTablet) deviceType = "tablet"
      else deviceType = "mobile"

      setState({
        isMobile,
        isTablet,
        isLaptop,
        isDesktop,
        deviceType,
        width,
        height,
      })
    }

    // Initial state
    updateState()

    // Listen for resize events
    window.addEventListener("resize", updateState)
    window.addEventListener("orientationchange", updateState)

    return () => {
      window.removeEventListener("resize", updateState)
      window.removeEventListener("orientationchange", updateState)
    }
  }, [])

  return state
}
