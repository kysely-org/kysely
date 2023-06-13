import React from 'react'
import Link from '@docusaurus/Link'
import { PRETTY_PACKAGE_MANAGER_NAMES, type PackageManager } from './shared'

export interface IUseADifferentPackageManagerProps {
  packageManager: PackageManager | undefined
  packageManagersURL: string
}

export function IUseADifferentPackageManager(
  props: IUseADifferentPackageManagerProps
) {
  const packageManagerName =
    PRETTY_PACKAGE_MANAGER_NAMES[props.packageManager || 'npm']

  return (
    <p style={{ display: 'flex', justifyContent: 'end' }}>
      <Link to={props.packageManagersURL}>
        I use a different package manager (not {packageManagerName})
      </Link>
    </p>
  )
}
