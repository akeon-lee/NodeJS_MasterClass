const handlers = require('./handlers');

// Router
const router = {
  'hello': handlers.hello,
  'notFound': handlers.notFound
}

module.exports = router;
