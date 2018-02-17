const http = require('http')
const { httpUsername, httpPassword } = require('./secret.json')

const bodyObj = {
  clientId: process.env.BADADS_CLIENT_ID,
  clientSecret: process.env.BADADS_CLIENT_SECRET,
  redirectUri: process.env.BADADS_REDIRECT_URI,
  refreshToken: process.env.BADADS_REFRESH_TOKEN,
  localSitesFile: process.env.BADADS_LOCAL_SITES_FILE,
  repoUrl: process.env.BADADS_REPO_URL,
  repoUsername: process.env.BADADS_REPO_USERNAME,
  repoPassword: process.env.BADADS_REPO_PASSWORD,
  repoLocalPath: process.env.BADADS_REPO_LOCAL_PATH
}
const bodyJson = JSON.stringify(bodyObj, null, 2)

// http://localhost:8010/badads/us-central1/update
const reqOptions = {
  port: 8010,
  path: '/badads/us-central1/update',
  method: 'POST',
  auth: httpUsername + ':' + httpPassword,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyJson)
  }
}

const req = http.request(reqOptions, res => {
  if (res.statusCode < 200 || res.statusCode > 299)
    throw new Error('Failure: ' + res.statusCode + ' - ' + res.statusMessage)
  else
    console.log('Success')
})
req.write(bodyJson)
req.end()