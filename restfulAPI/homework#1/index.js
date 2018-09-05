/* 
 * Homework Assignment #1 - Hello World App
 */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./config');
const router = require('./router');

const server = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Just in case we decide to use https in the future
const unifiedServer = (req, res) => {
  // Parse the url
  const parsed = url.parse(req.url, true);

  // Get the path of the trimmed version
  const path = parsed.path;
  const trimmed = path.replace(/^\/+|\/+$/g, '');

  // Get querystring as object
  const qstring = parsed.query;

  // Get the http method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  // On end of data request
  req.on('data', () => {
    buffer += decoder.write(data);
  });

  // On end of request
  res.end('end', () => {
    buffer += decoder.end();

    // Choose the handler that this request should go to.
    const chosen = typeof(router[trimmed]) !== 'undefined' ? router[trimmed] : router.notFound;

    // Construct the data to send to the handler
    const data = {
      'trimmed': trimmed,
      'querystring': qstring,
      'method': method,
      'headers': headers,
      'payload': buffer 
    };

    // Route the request to the handler specified in the router
    chosen(data, (status, payload) => {
      // Use the status code provided by the handler
      status = typeof(status) === 'number' ? status : 200;

      // Use the payload provided by the handler
      payload = typeof(payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.writeHead(status)
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response: ', status, payloadString);

    });
  });
};

server.listen(config.port, () => {
  console.log(`Server is listening on port ${config.port}, in ${config.envName} mode`);
});
