/**
 * This script goes through all generated type definition files and copies
 * method/property documentation from interfaces to the implementing methods
 * IF the implementation doesn't have its own documentation.
 *
 * This is done for convenience: users can cmd-click method names and immediately
 * see the documentation. If we don't do that, users need to cmd-click the method
 * and then manually find the correct interface that contains the documentation.
 *
 * Hovering over a method/property works even without this script, but not all
 * people are happy reading docs from the small hovering window.
 */

const fs = require('fs')
const path = require('path')

const DIST_PATH = path.join(__dirname, '..', 'dist')

const PROPERTY_REGEX = /^\s+(?:get )?(?:readonly )?(?:abstract )?(\w+)[\(:<]/
const OBJECT_REGEXES = [
  /^(?:export )?declare (?:abstract )?class (\w+)/,
  /^(?:export )?interface (\w+)/,
]
const GENERIC_ARGUMENTS_REGEX = /<[\w"'`,{}= ]+>/g
const JSDOC_START_REGEX = /^\s+\/\*\*/
const JSDOC_END_REGEX = /^\s+\*\//

function main() {
  for (const distSubDir of ['cjs', 'esm']) {
    const subDirPath = path.join(DIST_PATH, distSubDir)
    const files = []

    if (!fs.existsSync(subDirPath)) {
      continue
    }

    forEachFile(subDirPath, (filePath) => {
      if (filePath.endsWith('.d.ts')) {
        const file = {
          path: filePath,
          lines: readLines(filePath),
        }

        file.objects = parseObjects(file)

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

/**
 * Parses all object (class, interface) declarations from the given
 * type declaration file.
 */
function parseObjects(file) {
  const objects = []
  let lineIdx = 0

  while (lineIdx < file.lines.length) {
    for (const regex of OBJECT_REGEXES) {
      const objectMatch = regex.exec(file.lines[lineIdx])

      if (objectMatch) {
        const object = {
          name: objectMatch[1],
          lineIdx,
          implements: parseImplements(file.lines[lineIdx]),
          properties: [],
        }

        while (!file.lines[++lineIdx].startsWith('}')) {
          const propertyMatch = PROPERTY_REGEX.exec(file.lines[lineIdx])

          if (propertyMatch) {
            const property = {
              name: propertyMatch[1],
              lineIdx: lineIdx,
              doc: parseDocumentation(file.lines, lineIdx),
            }

            Object.defineProperty(property, 'object', { value: object })
            object.properties.push(property)
          }
        }

        Object.defineProperty(object, 'file', { value: file })
        objects.push(object)

        continue
      }
    }

    ++lineIdx
  }

  return objects
}

/**
 * Given an object declaration line like
 *
 *   export class A extends B implements C, D<number> {
 *
 * or
 *
 *   interface A<T> extends B<T> {
 *
 * extracts the names of the extended and implemented objects.
 * The first example would return ['B', 'C', 'D'] and the second
 * would return ['B'].
 */
function parseImplements(line) {
  if (!line.endsWith('{')) {
    console.warn(
      `skipping object declaration "${line}". Expected it to end with "{"'`
    )
    return []
  }

  // Remove { from the end.
  line = line.substring(0, line.length - 1)

  // Strip generics. We need to do this in a loop to strip nested generics.
  while (line.includes('<')) {
    let strippedLine = line.replace(GENERIC_ARGUMENTS_REGEX, '')

    if (strippedLine === line) {
      console.warn(`unable to strip generics from "${line}"`)
      return []
    }

    line = strippedLine
  }

  if (line.includes('extends')) {
    line = line.split('extends')[1].replace('implements', ',')
  } else if (line.includes('implements')) {
    line = line.split('implements')[1]
  } else {
    return []
  }

  return line.split(',').map((it) => it.trim())
}

/**
 * Given the line index of a property (method, getter) declaration
 * extracts the jsdoc comment above it if one exists.
 */
function parseDocumentation(lines, propertyLineIdx) {
  const doc = []
  let lineIdx = propertyLineIdx - 1

  if (JSDOC_END_REGEX.test(lines[lineIdx])) {
    doc.push(lines[lineIdx])
    --lineIdx

    while (!JSDOC_START_REGEX.test(lines[lineIdx])) {
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
          const docProperty = findDocProperty(files, object, property.name)

          if (docProperty) {
            file.lines.splice(property.lineIdx, 0, ...docProperty.doc)
          }
        }
      }
    }

    fs.writeFileSync(file.path, file.lines.join('\n'))
  }
}

function findDocProperty(files, object, propertyName) {
  for (const interfaceName of object.implements) {
    const interfaceObject = findObject(files, interfaceName)

    if (!interfaceObject) {
      continue
    }

    const interfaceProperty = interfaceObject.properties.find(
      (it) => it.name === propertyName
    )

    if (interfaceProperty?.doc) {
      return interfaceProperty
    }

    // Search all parents even if this object didn't have the
    // proprty. It may be defined and documented in an ancestor.
    const doc = findDocProperty(files, interfaceObject, propertyName)

    if (doc) {
      return doc
    }
  }

  return undefined
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
