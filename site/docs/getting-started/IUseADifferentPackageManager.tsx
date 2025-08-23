import Link from '@docusaurus/Link'
import {
  DEFAULT_PACKAGE_MANAGER,
  PRETTY_PACKAGE_MANAGER_NAMES,
  type PropsWithPackageManager,
} from './shared'

export function IUseADifferentPackageManager(
  props: Pick<
    PropsWithPackageManager,
    'packageManager' | 'packageManagerSelectionID'
  >,
) {
  const { packageManager, packageManagerSelectionID } = props

  if (!packageManagerSelectionID) {
    return null
  }

  const packageManagerName =
    PRETTY_PACKAGE_MANAGER_NAMES[packageManager || DEFAULT_PACKAGE_MANAGER]

  return (
    <p style={{ display: 'flex', justifyContent: 'end' }}>
      <Link to={`#${packageManagerSelectionID}`}>
        I use a different package manager (not {packageManagerName})
      </Link>
    </p>
  )
}
