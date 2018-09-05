/* Module for the request handlers */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Instantiate the container
const handlers = {};

// Ping handler
handlers.ping = async (data) => {
  // Return 200, since this route is good
  const send = {
    'status': 200,
    'payload': { 'Hello': 'World' }
  };
  return send;
};

// Not found handler
handlers.notFound = async (data) => {
  // Return 404, page not found
  const send = {
    'status': 404,
    'payload': { 'notFound': 'Path was not found' }
  };
  return send;
};

// Users handler
handlers.users = async (data) => {
  const acceptedMethods = ['post', 'get', 'put', 'delete'];
  if(acceptedMethods.indexOf(data.method) > -1) {
    return handlers._users[data.method](data);
  } else {
    return 405
  };
};

// Instantiate the users sub-methods
handlers._users = {};

// Users - post
// Required data: `firstName`, `lastName`, `phone`, `password`, `tosAgreement`
// Optional data: none
handlers._users.post = async (data) => {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const email = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;
  const address = typeof(data.payload.address) === 'string' && data.payload.address.trim().length > 5 ? data.payload.address.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 3 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

  // If all postData is valid
  if(firstName && lastName && phone && email && address && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    const data = await _data.read('users', phone);
    if(data) {
      return { 'status': 400, 'payload': {'Error': 'A user with that phone number already exists'} };
    } else {
      // Hash the password
      const hashedPassword = helpers.hash(password);

      // Create the user object
      if(hashedPassword) {
        const userObject = {
          'firstName': firstName,
          'lastName': lastName,
          'phone': phone,
          'email': email,
          'address': address,
          'cart': [],
          'hashedPassword': hashedPassword,
          'tosAgreement': true
        };

        // Store the user
        const create = await _data.create('users', phone, userObject);
        if(create === true) {
          return { 'status': 200, 'payload': {'Success': 'User has been created!'} };
        } else {
          console.log(create);
          return { 'status': 500, 'payload': {'Error': 'There were errors creating the user'} };
        };
      } else {
        return { 'status': 500, 'payload': {'Error': 'Could not hash the users password'} };
      }
    }
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required fields'} };
  }
};

// Users - get
// Required data: `phone`
// Optional data: none
handlers._users.get = async (data) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

  if(phone) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);
    if(valid) {
      // Lookup the user
      const data = await _data.read('users', phone);
      if(data) {
        // Remove the hashed password from the user object
        delete data.hashedPassword;
        return { 'status': 200, 'payload': data };
      } else {
        return { 'status': 404 };
      }
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    }
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  }
};

// Users = put
// Required data: `phone`
// Optional data: `firstName`, `lastName`, `email`, `address`, `password` (atleast one must be specified)
handlers._users.put = async (data) => {
  // Check for required fields
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const email = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;
  const address = typeof(data.payload.address) === 'string' && data.payload.address.trim().length > 5 ? data.payload.address.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 3 ? data.payload.password.trim() : false;

  // If phone is valid
  if(phone) {
    // If other fields are valid
    if(firstName || lastName || email || address || password) {
      // Get the token from the headers
      const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the phone
      const valid = await handlers._tokens.verify(token, phone);

      if(valid) {
        const userData = await _data.read('users', phone);
        if(userData) {
          // Update the fields specified
          if(firstName) {
            userData.firstName = firstName;
          }
          if(lastName) {
            userData.lastName = lastName;
          }
          if(email) {
            userData.email = email;
          }
          if(address) {
            userData.address = address;
          }
          if(password) {
            userData.hashedPassword = helpers.hash(password);
          }
  
          // Store the new updates
          const update = await _data.update('users', phone, userData);
          if(update === true) {
            return { 'status': 200, 'payload': {'Success': 'The user has been updated'} };
          } else {
            // If there is an error
            console.log(update);
            return { 'status': 500, 'payload': {'Error': 'Something went wrong updating the user'} };
          }
        } else {
          return { 'status': 400, 'payload': {'Error': 'The specified user may not exist'} };
        }
      } else {
        return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
      };
    } else {
      return { 'status': 400, 'payload': {'Error': 'Missing fields to update'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Users - delete
// Required data: `phone`
// Optional data: none
handlers._users.delete = async (data) => {
  // Check if phone is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

  if(phone) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);

    if(valid) {
      // Look up the user
      const userData = await _data.read('users', phone);
      if(userData) {
        const deleted = await _data.delete('users', phone);
        if(deleted) {
          return { 'status': 200, 'payload': {'Success': 'User has been deleted'} };
        } else {
          return { 'status': 500, 'payload': {'Error': 'Could not delete the specified user'} };
        };
      } else {
        return { 'status': 400, 'payload': {'Error': 'Could not find the specified user'} };
      };
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Tokens
handlers.tokens = (data) => {
  // Acceptable methods
  const accepted = ['post', 'get', 'put', 'delete'];
  // If an accepted method was passed
  if(accepted.indexOf(data.method) > -1) {
    return handlers._tokens[data.method](data);
  } else {
    return { 'status': 405 };
  }
};

// Container for all the tokens method
handlers._tokens = {};

// Tokens - post
// Required data: `phone`, `password`
// Optional data: none
handlers._tokens.post = async (data) => {
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(phone && password) {
    // Look up the user who matches the phone
    const userData = await _data.read('users', phone);
    if(userData) {
      // Has the sent password and compare it to the password stored in the user object
      const hashed = helpers.hash(password);
      if(hashed === userData.hashedPassword) {
        // If valid, create a new token with a random name. Set expiration date 1 hour in the future
        const tokenId = helpers.createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60;
        const token = {
          'phone': phone,
          'id': tokenId,
          'expires': expires
        };

        // Store the token
        const created =  await _data.create('tokens', tokenId, token);
        if(created) {
          return { 'status': 200, 'payload': token };
        } else {
          return { 'status': 500, 'payload': {'Error': 'Could not create the new token'} };
        };
      } else {
        return { 'status': 400, 'payload': {'Error': 'Password did not match the specified users stored password'} };
      };
    } else {
      return { 'status': 400, 'payload': {'Error': 'Could not find the specified user'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required fields'} };
  };
};

// Tokens - get
// Required data: `id`
// Optional data: none
handlers._tokens.get = async (data) => {
  // Check that the id field is valid
  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

  if(id) {
    // Lookup the token
    const tokenData = await _data.read('tokens', id);
    if(tokenData) {
      return { 'status': 200, 'payload': tokenData };
    } else {
      return { 'status': 404 };
    }
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required fields'} };
  }
};

// Tokens - put
// Required data: `id`, `extend`
// Optional data: none
handlers._tokens.put = async (data) => {
  const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

  if(id && extend) {
    // Lookup the token
    let tokenData = await _data.read('tokens', id);
    if(tokenData) {
      // Check that the token is not expired
      if(tokenData.expires > Date.now()) {
        // Set the expiration date an hour from now
        tokenData.expires = Date.now() + 1000 * 60 * 60;

        // Store the new updates
        const updated = _data.update('tokens', id, tokenData);
        if(updated) {
          return { 'status': 200 };
        } else {
          return { 'status': 500, 'payload': {'Error': 'Could not update the token\'s expiration'} };
        }
      } else {
        return { 'status': 400, 'payload': {'Error': 'The token has already expired and cannot be extened'} };
      };
    } else {
      return { 'status': 400, 'payload': {'Error': 'Specified token does not exist'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field(s) or field(s) are invalid'} };
  };
};

// Tokens - delete
// Required data: `id`
// Optional data: none
handlers._tokens.delete = async (data) => {
  // Check that the id is valid
  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

  if(id) {
    // Lookup the users token
    const data = await _data.read('tokens', id);
    if(data) {
      const deleted = await _data.delete('tokens', id);
      if(deleted) {
        return { 'status': 200 };
      } else {
        return { 'status': 500, 'payload': {'Error': 'Could not delete the specified token'} };
      };
    } else {
      return { 'status': 400, 'payload': {'Error': 'Could not find the specified token'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verify = async (id, phone) => {
  // Lookup the token
  const tokenData = await _data.read('tokens', id);

  if(tokenData) {
    // Check that token for the given user and that it is not expired
    if(tokenData.phone === phone && tokenData.expires > Date.now()) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  };
};


// Menu Handler
handlers.menu = async (data) => {
  const acceptedMethods = ['get'];
  if(acceptedMethods.indexOf(data.method) > -1) {
    return handlers._menu[data.method](data);
  } else {
    return 405
  };
};

// Instantiate Menu Container
handlers._menu = {};

// Menu - get
// Required data: `phone`
// Optiona data: none
handlers._menu.get = async (data) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

  if(phone) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);
    if(valid) {
      const menuData = await _data.read('menu', 'menu');
      if(menuData) {
        // Return the menu items to the payload
        return { 'status': 200, 'payload': menuData };
      } else {
        return { 'status': 404 };
      };
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Handler for cart
handlers.cart = async (data) => {
  // Acceptable methods
  const accepted = ['post', 'get', 'delete'];
  if(accepted.indexOf(data.method) > -1) {
    return handlers._cart[data.method](data);
  } else {
    return 405;
  };
};

// Instantiate cart container
handlers._cart = {};

// Cart - post
// Required data: `phone`, `item_id`
// Optional data: none
handlers._cart.post = async (data) => {
  // Check that the phone number is valid
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  // Check that the id field is valid
  const id = typeof(data.payload.id) === 'string' ? data.payload.id.trim() : false;

  if(phone && id) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);
    if(valid) {
      // Add the item specified in the payload to the cart
      // Get the menu item
      const menuData = await _data.read('menu', 'menu');
      // Get the userData
      const userData = await _data.read('users', phone);
      // Add items to the cart section of userData, create cart if it doesn't exist
      userData.cart ? userData.cart : userData.cart = [];
      // For our purposes we will not allow duplicate items in the cart
      const exists = userData.cart.find(x => x.name === menuData[id].name);
      if(exists) {
        return { 'status': 400, 'payload': {'Error': 'That item already exists in the cart'} };
      } else {
        userData.cart.push(menuData[id]);
        const update = await _data.update('users', phone, userData);
        if(update) {
          return { 'status': 200, 'payload': userData.cart };
        } else {
          return { 'status': 500, 'payload': {'Error': 'Could not update the token\'s expiration'} };
        };
      };
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Cart - get
// Required data: `phone`
// Optional data: none
handlers._cart.get = async (data) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

  if(phone) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);

    if(valid) {
      // Get the cart items from userData
      const userData = await _data.read('users', phone);
      if(userData) {
        return { 'status': 200, 'payload': userData.cart };
      } else {
        return { 'status': 500, 'payload': {'Error': 'Could not get the users cart data'} };
      };
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Cart - delete
// Required data: `phone`, `item_id`
// Optional data: none
handlers._cart.delete = async (data) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  // Check that the id field is valid
  const id = typeof(data.queryStringObject.id) === 'string' ? data.queryStringObject.id.trim() : false;

  if(phone && id) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);
    if(valid) {
      // Get the menu item
      const menuData = await _data.read('menu', 'menu');
      // Get the userData
      const userData = await _data.read('users', phone);
      // Find the index of item in cart to remove
      const index = userData.cart.findIndex(x => x.name === menuData[id].name);
      userData.cart.splice(index, 1);
      const update = await _data.update('users', phone, userData);

      if(update) {
        return { 'status': 200, 'payload': userData.cart };
      } else {
        return { 'status': 500, 'payload': {'Error': 'Could not delete the item from the cart'} };
      };
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

// Handler for cart
handlers.checkout = async (data) => {
  // Acceptable methods
  const accepted = ['post'];
  if(accepted.indexOf(data.method) > -1) {
    return handlers._checkout[data.method](data);
  } else {
    return 405;
  };
};

// Instantiate _checkout
handlers._checkout = {};

// Cart - get
// Required data: `phone`, `source`, `toEmail`
// Optional data: none
handlers._checkout.post = async (data) => {
  // Check that the phone number is valid
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const source = typeof(data.payload.source) === 'string' ? data.payload.source.trim() : false;
  const toEmail = typeof(data.payload.toEmail) === 'string' && data.payload.toEmail.trim().length > 5 ? data.payload.toEmail.trim() : false;

  if(phone && source && toEmail) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the token is valid for the phone
    const valid = await handlers._tokens.verify(token, phone);

    if(valid) {
      // Get the cart items from userData
      const userData = await _data.read('users', phone);
      const cart = userData.cart;

      const transaction = {
        'items': [],
        'total': 0
      };

      for(const item of cart) {
        transaction.items.push(item.name);
        transaction.total += item.price;
      };

      const charge = await helpers.stripeTransaction(transaction.total, 'USD', source, userData.email, transaction.items);
      // If the charge is successful
      if(charge !== 'error') {
        if(userData.cart.length > 0) {
          // Empty out the cart
          userData.cart = [];
          // Update the user's cart
          await _data.update('users', phone, userData);
  
          // Object to return finished transaction
          const finished = {
            'items': charge.description,
            'total': transaction.total,
            'id': charge.id
          };
  
          // Send email to user
          helpers.sendEmail(toEmail, `Your order for ${finished.items}`, 
          `Hello ${userData.firstName} ${userData.lastName},
  
            This email is to confirm that order# ${finished.id} was successfully processed.
  
              Your order items:
                ${finished.items}

              Your total:
                ${finished.total}
            
            If there were any questions you have please call (555) 555-5555.
          
          Thank you for ordering pizza from us.`);
          return { 'status': 200, 'payload': finished };
        } else {
          return { 'status': 400, 'payload': {'Error': 'The cart is empty'} };
        };
      } else {
        return { 'status': 400, 'payload': {'Error': 'Something went wrong with the transaction'} };
      };
    } else {
      return { 'status': 403, 'payload': {'Error': 'Missing required token in header, or token is invalid'} };
    };
  } else {
    return { 'status': 400, 'payload': {'Error': 'Missing required field'} };
  };
};

module.exports = handlers;
