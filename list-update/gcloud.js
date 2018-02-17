const lib = require('./lib')
const { httpUsername, httpPassword } = require('./secret.json')

// Google functions entry point
exports.update = (req, res) => {
  // Validate the username and password first
  const [authType, authValue] = (req.get('Authorization') || '').split(' ')
  const [authUser, authPass] = Buffer.from(authValue || '', 'base64').toString().split(':')
  if (authType != 'Basic' || authUser != httpUsername || authPass != httpPassword) {
    res.status(401).end()
    return
  }
  console.log('Beginning update')
  lib.run(req.body).
    then(() => res.end()).
    catch(err => {
      if (!(err instanceof Error)) err = new Error(err)
      console.error(err)
      res.status(500).send('Internal failure')
    })
}