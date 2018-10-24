// These are server related tasks

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// Instantiate the server module object
const server = {};

// Instantiate the http server
server.httpServer = http.createServer((req, res) => {
	server.unifiedServer(req, res);
});

// Instantiate the https server
server.httpsServerOptions = {
	'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
	server.unifiedServer(req, res);
});

// All the server logic for both the http and https server
server.unifiedServer = (req, res) => {
	// Get the url and parse it
	const parsed = url.parse(req.url, true);

	// debug('The full parsed url object', parsed);

	// Get the path from the url
	const path = parsed.pathname;
	const trimmed = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	const qstring = parsed.query;

	// Get the http method
	const method = req.method.toLowerCase();

	// Get the headers as an object
	const headers = req.headers;

	// Get the payload, if any
	const decoder = new StringDecoder('utf8');
	let buffer = ''; // This acts as a placeholder for the string, here we call it buffer

	// On received data request
	req.on('data', (data) => {
		buffer += decoder.write(data);
	});
	
	// On end of request
	req.on('end', () => {
		buffer += decoder.end();

		// Choose the handler that this request should go to. If one is not found then use the notFound handler
		const chosen = typeof(server.router[trimmed]) !== 'undefined' ? server.router[trimmed] : handlers.notFound;

		// Contruct the data object to send to the handler
		const data = {
			'trimmedPath': trimmed,
			'queryStringObject': qstring,
			'method': method,
			'headers': headers,
			'payload': helpers.parseJSONToObject(buffer)
		};

		// Route the request to the handler specified in the router
		chosen(data, (status, payload, contentType) => {

			// Determine the type of response (fallback to JSON)
			contentType = typeof(contentType) === 'string' ? contentType : 'json';

			// Use the status code called back by the handler, or default to 200
			status = typeof(status) === 'number' ? status : 200;

			// Return the response-parts that are content-specific
			let payloadString = '';
			if(contentType === 'json') {
				res.setHeader('Content-Type', 'application/json');
				payload = typeof(payload) === 'object' ? payload : {};
				payloadString = JSON.stringify(payload);
			}

			if(contentType === 'html') {
				res.setHeader('Content-Type', 'text/html');
				payloadString = typeof(payload) === 'string' ? payload : '';
			}

			// Return the response-parts that are common to all content-types
			res.writeHead(status);
			res.end(payloadString);

			// If the response is 200, print green otherwise print red
			if(status === 200) {
				debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()}/${trimmed} ${status}`);
			} else {
				debug('\x1b[31m%s\x1b[0m', `${method.toUpperCase()}/${trimmed} ${status}`);
			}
		});
	});
};

// Define a request router
server.router = {
	'':	handlers.index,
	'account/create': handlers.accountCreate,
	'account/edit':	handlers.accountEdit,
	'account/deleted': handlers.accountDeleted,
	'session/create': handlers.sessionCreate,
	'session/deleted': handlers.sessionDeleted,
	'checks/all':	handlers.checkList,
	'checks/create': handlers.checksCreate,
	'checks/edit': handlers.checksEdit,
	'ping': handlers.ping,
	'api/users': handlers.users,
	'api/tokens': handlers.tokens,
	'api/checks': handlers.checks
};

// Init script
server.init = () => {
  // Start the http server
  server.httpServer.listen(config.httpPort, () => {
		console.log('\x1b[36m%s\x1b[0m', `Server is listening on port ${config.httpPort}, in ${config.envName} mode`);
  });

  // Start the https server
  server.httpsServer.listen(config.httpsPort, () => {
		console.log('\x1b[35m%s\x1b[0m', `Server is listening on port ${config.httpsPort}, in ${config.envName} mode`);
  });
};

module.exports = server;
