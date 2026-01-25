export class SyncNotSupportedError extends Error {
  constructor() {
    super(
      'Synchronous execution is not supported by the current dialect. ' +
        'Only SQLite currently supports sync execution.',
    )
    this.name = 'SyncNotSupportedError'
  }
}

export class PluginSyncNotSupportedError extends Error {
  readonly pluginName: string

  constructor(pluginName: string) {
    super(
      `Plugin '${pluginName}' does not support synchronous execution. ` +
        'Ensure the plugin implements the transformResultSync method.',
    )
    this.name = 'PluginSyncNotSupportedError'
    this.pluginName = pluginName
  }
}
