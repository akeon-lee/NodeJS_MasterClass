/* Homework Assignment #2 - Pizza Delivery Company */

// Dependencies
const server = require('./lib/server');

// Container for the app
const app = {};

// Init Function
app.init = () => {
  // Start the server
  server.init();
};

// Execute the app
app.init();

module.exports = app;
