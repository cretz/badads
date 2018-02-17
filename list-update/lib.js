const { exec } = require('child_process')
const fs = require('fs')
const { google } = require('googleapis')
const os = require('os')
const path = require('path')
const url = require('url')

exports.run = (initialOptions) =>
  new Promise(resolve => resolve(validateAndPutDefaultsInOptions(Object.assign({}, initialOptions)))).
    then(options =>
      Promise.all([loadViolatingSites(options), cloneRepo(options)]).
        then(([sites]) => updateRepo(options, sites).then(() => pushRepo(options)))
    )

function validateAndPutDefaultsInOptions(options) {
  const field = (name, dflt) => {
    if (!options[name]) {
      if (dflt) options[name] = dflt
      else throw new Error('Missing option ' + name)
    }
  }
  field('clientId')
  field('clientSecret')
  field('redirectUri', 'http://localhost:3000/oauth2callback')
  field('refreshToken')
  field('repoUrl', 'https://github.com/cretz/badads.git')
  field('repoUser', 'github-badads')
  field('repoPassword')
  field('repoLocalPath', path.join(os.tmpdir(), 'badads-git'))
  field('repoCommitterName', 'GitHub Badads')
  field('repoCommitterEmail', 'github.badads@gmail.com')
  field('repoAuthorName', 'GitHub Badads')
  field('repoAuthorEmail', 'github.badads@gmail.com')
  return options
}

function loadViolatingSites(options) {
  // Use local file if specified
  if (options.localSitesFile) return new Promise((resolve, reject) =>
    fs.readFile(options.localSitesFile, 'utf8', (err, data) =>
      err ? reject(err) : resolve(JSON.parse(data))
    )
  )

  const oauthClient = new google.auth.OAuth2({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    redirectUri: options.redirectUri
  })
  oauthClient.setCredentials({ refresh_token: options.refreshToken })

  return oauthClient.refreshAccessToken().
    then(tokens => oauthClient.setCredentials(tokens.credentials)).
    then(() => new Promise((resolve, reject) =>
      google.adexperiencereport({
        version: 'v1',
        auth: oauthClient
      }).violatingSites.list({}, (err, response) =>
        err ? reject(err) : resolve(response)
      )
    )).
    then(response => response.data)
}

function promiseExec(cmd, opts) {
  return new Promise((resolve, reject) => {
    console.log('Executing', cmd)
    if (opts) console.log('Options', opts)
    exec(cmd, opts, (err, stdout, stderr) => {
      if (stdout) console.log('stdout', stdout)
      if (stderr) console.log('stderr', stderr)
      err ? reject(err) : resolve()
    })
  })
}

function cloneRepo(options) {
  // If the dir doesn't exist, we'll do a git clone, otherwise a git pull
  if (fs.existsSync(options.repoLocalPath))
    return promiseExec('git pull --depth 1 origin master', { cwd: options.repoLocalPath })
  return promiseExec('git clone --depth 1 ' + options.repoUrl + ' ' + options.repoLocalPath)
}

function updateRepo(options, sites) {
  // The sites need to be sorted first
  sites.violatingSites.sort((one, two) => one.reviewedSite.localeCompare(two.reviewedSite))
  // Store that
  return new Promise((resolve, reject) =>
    fs.writeFile(path.join(options.repoLocalPath, 'data', 'violatingSites.json'), JSON.stringify(sites, null, 2),
      err => err ? reject(err) : resolve())
  )
  // TODO: store others
}

function pushRepo(options) {
  const env = {
    GIT_COMMITTER_NAME: options.repoCommitterName,
    GIT_COMMITTER_EMAIL: options.repoCommitterEmail,
    GIT_AUTHOR_NAME: options.repoAuthorName,
    GIT_AUTHOR_EMAIL: options.repoAuthorEmail
  }
  return promiseExec(
      'git commit --allow-empty -a -m "' + (new Date()).toISOString() + '"', { cwd: options.repoLocalPath, env: env }).
    then(() => {
      // Inject the username and password into the URL
      // XXX: Yeah yeah, the password ends up in the logs here, who cares
      const repoUrl = url.parse(options.repoUrl)
      repoUrl.auth = options.repoUser + ':' + options.repoPassword
      return promiseExec('git push ' + repoUrl.format() + ' master', { cwd: options.repoLocalPath, env: env })
    })
}