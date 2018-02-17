const lib = require('./lib')

// Google functions entry point
exports.update = (req, res) => {
  console.log('Beginning update')
  lib.run(req.body).
    then(() => res.end()).
    catch(err => {
      if (!(err instanceof Error)) err = new Error(err)
      console.error(err)
      res.status(500).send('Internal failure')
    })
}