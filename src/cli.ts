#!/usr/bin/env node
import { log } from './logger'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as fg from 'fast-glob'
import * as yaml from 'js-yaml'
import { Config } from './config'

log.info('=================================================================')
log.info('randospire')
log.info('=================================================================')
log.info('')
log.info('How to use:')
log.info('  npx randospire file-name.rand.yaml')
log.info('  npx randospire file-name.rand.yaml ./target-directory')
log.info('')

log.info('-----------------------------------------------------------------')
// log.debug(process.argv)
const configFilePath = process.argv[2]
if (!configFilePath) {
  log.error(`No configuration file given as argument. Exiting.`)
  process.exit(1)
}
const configFileName = path.parse(configFilePath).name
const targetDir = process.argv[3] || process.cwd()
const targetSubFolder = targetDir + '/' + new Date().toISOString().split('.')[0].replace('T', '_').split(':').join('-') + '_' + configFileName
log.info(`Configuration file: ${process.argv[2]}`)
log.info(`Target directory: ${targetSubFolder}`)
log.info('-----------------------------------------------------------------')
log.info('')

try {
  const configText = fs.readFileSync(configFilePath).toString()
  const config = yaml.loadAll(configText) as Config

  const report: any = {
    config: config,
    inputFiles: {},
    outputFiles: {}
  }

  if (Array.isArray(config)) {
    for (const entry of config) {
      log.info('-----------------------------------------------------------------')
      log.info(`Processing: ${entry.name} and looking for ${entry.amount} random items.`)
      const startTime = Date.now();
      let filesToConsider: string[] = []

      for (const dir of entry.inputFolders) {
        let globPattern = '**/*'
        if (entry.fileExtensions && entry.fileExtensions.length > 0) {
          if (entry.fileExtensions.length === 1) {
            globPattern = `**/*.${entry.fileExtensions[0]}`
          } else {
            globPattern = `**/*.{${entry.fileExtensions.join(',')}}`

          }
        }
        log.info(`${dir}: Scanning directory for ${globPattern}`)
        const results = fg.sync(globPattern, {
          cwd: dir,
          absolute: true
        })
        log.info(`${dir}: Found ${results.length} matching files`)
        filesToConsider = filesToConsider.concat(results)
      }

      const randomResults = shuffle(filesToConsider)
      const pickedResults = randomResults.slice(0, entry.amount)
      report.inputFiles[entry.name] = pickedResults
      report.outputFiles[entry.name] = []

      try {
        const entryTargetDir = `${targetSubFolder}/${entry.name}`
        fs.ensureDirSync(entryTargetDir)
        pickedResults.forEach((el, index) => {
          const targetFileName = `${index.toString().padStart(3, '0')}_${path.parse(el).base}`
          const targetFilePath = `${entryTargetDir}/${targetFileName}`;
          report.outputFiles[entry.name].push(targetFilePath)
          fs.copyFileSync(el, targetFilePath)
          log.info(`Copied chosen file:`, targetFilePath)
        })

      } catch (err) {
        log.error(`Could not copy / write resulting files`, err)
        process.exit(1)
      }

      const finishedTime = Date.now()
      log.info(`Completed in ${finishedTime - startTime}ms. Picked ${entry.amount} files out of ${randomResults.length}`)

      log.info('-----------------------------------------------------------------')
      log.info(' ')
    }
  } else {
    log.error(`The config file has not the expected structure. Please read the documentation.`)
    process.exit(1)
  }

  const reportFilePath = `${targetSubFolder}/report.yaml`
  log.info(`Written report: ${reportFilePath}`)
  fs.outputFileSync(reportFilePath, yaml.dump(report, { lineWidth: 1024}))

} catch (err) {
  log.error(`Could not read and parse config file: ${configFilePath}`)
  log.error(`Ensure the file exists at the given path and that it is a valid YAML file.`)
  log.error(err)
  process.exit(1)
}

log.info('=================================================================')

/**
 * Unbiased random shuffle array algorithm
 * @see https://stackoverflow.com/a/2450976
 */
function shuffle<T>(array: Array<T>): Array<T> {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}
