/* Module for server related tasks */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const debug = require('util').debuglog('server');

const config = require('./config');
const router = require('./router');
const handlers = require('./handlers');
const helpers = require('./helpers');

// Instantiate Module Container
const server = {};

// Instantiate the http server
server.httpServer = http.createServer((req, res) => {
  // Run the unifiedServer function
  server.unifiedServer(req, res);
});

// Server log for both http and https servers
server.unifiedServer = (req, res) => {
  // Get the url and parse it
  const parsed = url.parse(req.url, true);

  // Get the path from the url
  const path = parsed.pathname;
  const trimmed = path.replace(/^\/+|\/+$/g, '');

  // Get the querystring as an object
  const qstring = parsed.query;

  // Get the http method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;
  
  // Get the payload, if any
  const decoder = new StringDecoder('utf8');
  let buffer = ''; // This acts a placeholder for the payload string

  // On received data request
  req.on('data', (data) => {
    // Write to the buffer with StringDecoder
    buffer += decoder.write(data);
  });

  // End of the request
  req.on('end', async () => {
    buffer += decoder.end();

    // Choose the handler that this request should go to, if one is not found then use the notFound handler
    const chosen = typeof(router.routes[trimmed]) !== 'undefined' ? router.routes[trimmed] : handlers.notFound;

    // Construct the dtat object to send to the handler
    const data = {
      'trimmedPath': trimmed,
      'queryStringObject': qstring,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJSONToObject(buffer)
    };

    try {
      // Await the route requested by the handler specified in the router
      const received = await chosen(data);
  
      // Use the status code called back by the handler, or default to 200
      received.status = typeof(received.status) === 'number' ? received.status : 200;
  
      // Use the payload called back by the handler, or default to empty object
      received.payload = typeof(received.payload) === 'object' ? received.payload : {};
  
      // Convert the payload to a string
      const payloadString = JSON.stringify(received.payload);
  
      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(received.status);
      res.end(payloadString);
  
      // If the response is 200, print green otherwise print red
      if(received.status === 200) {
        console.log('\x1b[32m%s\x1b[0m', `${method.toUpperCase()}/${trimmed} ${received.status} + ${payloadString}`);
      } else {
        console.log('\x1b[31m%s\x1b[0m', `${method.toUpperCase()}/${trimmed} ${received.status} + ${payloadString}`);
      }
    } catch(e) {
      // Log any errors from chosen(), which calls the routers.routes to a handlers method
      console.log(e);
    }
  });
};

// Initiate the server
server.init = () => {
  // Start the http server
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', `Server is listening on port ${config.httpPort}, in ${config.envName} mode`);
  });
};

module.exports = server;
