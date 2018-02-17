const lib = require('./lib')

lib.run({
  clientId: process.env.BADADS_CLIENT_ID,
  clientSecret: process.env.BADADS_CLIENT_SECRET,
  redirectUri: process.env.BADADS_REDIRECT_URI,
  refreshToken: process.env.BADADS_REFRESH_TOKEN,
  localSitesFile: process.env.BADADS_LOCAL_SITES_FILE,
  repoUrl: process.env.BADADS_REPO_URL,
  repoUsername: process.env.BADADS_REPO_USERNAME,
  repoPassword: process.env.BADADS_REPO_PASSWORD,
  repoLocalPath: process.env.BADADS_REPO_LOCAL_PATH
}).catch(err => {
  console.error(err)
  process.exit(1)
})