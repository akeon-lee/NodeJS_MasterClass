/* Module for routers */

// Dependencies
const handlers = require('./handlers');

// Instantiate Container
const router = {};

router.routes = {
  'ping': handlers.ping,
  'notFound': handlers.notFound,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'menu': handlers.menu,
  'cart': handlers.cart,
  'checkout': handlers.checkout
};

module.exports = router;
