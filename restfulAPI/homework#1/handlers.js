const handlers = {};

handlers.hello = (data, callback) => {
  callback(data, { 'hello': 'user' });
};

handlers.notFound = (data, callback) => {
  callback(404, { 'notFound': 'Path was not found' });
};

module.exports = handlers;
