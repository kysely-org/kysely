import React from 'react'
import clsx from 'clsx'
import { useColorMode } from '@docusaurus/theme-common'
import useIsBrowser from '@docusaurus/useIsBrowser'
import type { Props } from '@theme/ColorModeToggle'
import IconDarkMode from '@theme/Icon/DarkMode'
import IconLightMode from '@theme/Icon/LightMode'
import styles from './styles.module.css'

function IconMonitor({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <rect height="13" rx="2" width="18" x="3" y="4" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

// VitePress-style pill switch, plus a crescent "system" button tucked into
// its left side. The crescent is lit while no explicit preference is stored
// (value === null): the pill then mirrors the OS mode, including timed
// day/night switching. Clicking the pill pins an explicit choice and unlights
// the crescent; clicking the crescent clears the choice and re-aligns the
// pill with the system.
function ColorModeToggle({ className, buttonClassName, value, onChange }: Props) {
  const isBrowser = useIsBrowser()
  const { colorMode } = useColorMode()
  const isDark = colorMode === 'dark'
  const isSystem = value === null

  return (
    <div className={clsx(styles.toggle, className)}>
      <button
        aria-label="Match system preferences"
        aria-pressed={isSystem}
        className={clsx(
          'clean-btn',
          styles.crescent,
          isSystem && styles.crescentActive,
        )}
        disabled={!isBrowser}
        onClick={() => onChange(isSystem ? colorMode : null)}
        title={`Match system preferences ${
          isSystem ? 'enabled' : 'disabled'
        }, click to ${isSystem ? 'disable' : 'enable'}`}
        type="button"
      >
        <IconMonitor className={styles.crescentIcon} />
      </button>
      <button
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={clsx('clean-btn', styles.track, buttonClassName)}
        disabled={!isBrowser}
        onClick={() => onChange(isDark ? 'light' : 'dark')}
        role="switch"
        title={`${isDark ? 'Dark' : 'Light'} mode, click to change`}
        type="button"
      >
        <span className={styles.thumb}>
          <IconLightMode
            aria-hidden
            className={clsx(styles.icon, styles.sun)}
          />
          <IconDarkMode
            aria-hidden
            className={clsx(styles.icon, styles.moon)}
          />
        </span>
      </button>
    </div>
  )
}

export default React.memo(ColorModeToggle)
