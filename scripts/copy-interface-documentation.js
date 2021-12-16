/**
 * This script goes through all generated type definition files and copies
 * method documentation from interfaces to the implementing methods IF
 * the implementation doesn't have its own documentation.
 *
 * This is done for convenience: users can cmd-click method names and they
 * always get to the documentation. If we don't do that, users need to
 * cmd-click the method and then manually find the correct interface that
 * contains the documentation.
 */

const fs = require('fs')
const path = require('path')

const DIST_PATH = path.join(__dirname, '..', 'dist')

function main() {
  for (const distSubDir of ['cjs', 'esm']) {
    const files = []

    if (!fs.existsSync(path.join(DIST_PATH, distSubDir))) {
      continue
    }

    forEachFile(path.join(DIST_PATH, distSubDir), (filePath) => {
      if (filePath.endsWith('.d.ts')) {
        const file = {
          path: filePath,
          lines: readLines(filePath),
        }

        file.objects = findObjects(file)

        if (file.objects.length > 0) {
          files.push(file)
        }
      }
    })

    copyDocumentation(files)
  }
}

function forEachFile(dir, callback) {
  const files = fs.readdirSync(dir).filter((it) => it !== '.' && it !== '..')

  for (const file of files) {
    const filePath = path.join(dir, file)

    if (isDir(filePath)) {
      forEachFile(filePath, callback)
    } else {
      callback(filePath)
    }
  }
}

function isDir(file) {
  return fs.lstatSync(file).isDirectory()
}

function readLines(filePath) {
  const data = fs.readFileSync(filePath).toString('utf-8')
  return data.split('\n')
}

function findObjects(file) {
  const OBJECT_REGEXES = [
    /export declare (?:abstract )?class (\w+)/,
    /export interface (\w+)/,
  ]

  const PROPERTY_REGEX = /^\s+(?:get )?(?:readonly )?(?:abstract )?(\w+)[\(:<]/
  const GENERIC_ARGUMENTS_REGEX = /<[\w, ]+>/g

  const objects = []
  let lineIdx = 0

  while (lineIdx < file.lines.length) {
    for (const regex of OBJECT_REGEXES) {
      const objectMatch = regex.exec(file.lines[lineIdx])

      if (objectMatch) {
        const implements = file.lines[lineIdx]
          .split('implements')[1]
          ?.replaceAll(GENERIC_ARGUMENTS_REGEX, '')
          ?.split(',')
          ?.map((it) => it.replace('{', '').trim())

        const object = {
          name: objectMatch[1],
          lineIdx,
          implements: implements ?? [],
          properties: [],
        }

        while (!file.lines[++lineIdx].startsWith('}')) {
          const propertyMatch = PROPERTY_REGEX.exec(file.lines[lineIdx])

          if (propertyMatch) {
            const property = {
              name: propertyMatch[1],
              lineIdx: lineIdx,
              doc: getDocumentation(file.lines, lineIdx),
            }

            Object.defineProperty(property, 'object', { value: object })
            object.properties.push(property)
          }
        }

        if (object.properties.length > 0) {
          Object.defineProperty(object, 'file', { value: file })
          objects.push(object)
        }

        continue
      }
    }

    ++lineIdx
  }

  return objects
}

function getDocumentation(lines, propertyLineIdx) {
  const doc = []
  let lineIdx = propertyLineIdx - 1

  if (/^\s+\*\//.test(lines[lineIdx])) {
    doc.push(lines[lineIdx])
    --lineIdx

    while (!/^\s+\/\*\*/.test(lines[lineIdx])) {
      doc.push(lines[lineIdx])
      --lineIdx
    }

    doc.push(lines[lineIdx])
    return doc.reverse()
  }

  return undefined
}

function copyDocumentation(files) {
  for (const file of files) {
    for (const object of file.objects) {
      const undocumentedProperties = new Set()

      // Only keep one undocumented property by same name.
      object.properties = object.properties.filter((it) => {
        if (it.doc) {
          return true
        }

        if (undocumentedProperties.has(it.name)) {
          return false
        }

        undocumentedProperties.add(it.name)
        return true
      })
    }
  }

  for (const file of files) {
    for (const object of file.objects.slice().reverse()) {
      for (const property of object.properties.slice().reverse()) {
        if (!property.doc) {
          const docProperty = findDocProperty(files, property)

          if (docProperty) {
            file.lines.splice(property.lineIdx, 0, ...docProperty.doc)
          }
        }
      }
    }

    fs.writeFileSync(file.path, file.lines.join('\n'))
  }
}

function findDocProperty(files, property) {
  for (const interfaceName of property.object.implements) {
    const interfaceObject = findObject(files, interfaceName)
    const interfaceProperty = interfaceObject.properties.find(
      (it) => it.name === property.name
    )

    if (interfaceProperty) {
      if (interfaceProperty.doc) {
        return interfaceProperty
      }

      return findDocProperty(files, interfaceProperty)
    }
  }
}

function findObject(files, objectName) {
  for (const file of files) {
    for (const object of file.objects) {
      if (object.name === objectName) {
        return object
      }
    }
  }

  return undefined
}

main()
