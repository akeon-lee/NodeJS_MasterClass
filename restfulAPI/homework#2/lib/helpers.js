/* Helpers for various tasks */

// Dependencies
const crypto = require('crypto');

const config = require('./config');
const stripe = require('stripe')(config.stripe.secret);
const mailGun = require('mailgun-js')({ apiKey: config.mailGun.private, domain: config.mailGun.domain });

// Instantiate Container
const helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJSONToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;

  } catch(e) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = (str) => {
  if(typeof(str) === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;

  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

  if(strLength) {
    // Define all the possible characters that could go into a string
    const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';
    for(let i = 1; i <= strLength; i++) {
      // Get a random character from the possible characters string
      const random = possible.charAt(Math.floor(Math.random() * possible.length));
      // Append this random char to the final string
      str += random;
    }
    // Return the final string
    return str;
  } else {
    return false;
  };
};

// Charge credit card
helpers.stripeTransaction = async (amount, currency, source, email, description) => {
  // Validate parameters
  amount = typeof(amount) === 'number' && amount > 0 ? amount : false;
  currency = typeof(currency) === 'string' ? currency.trim() : false;
  source = typeof(source) === 'string' ? source.trim() : false;
  email = typeof(email) === 'string' && email.trim().length > 5 ? email.trim() : false;
  description = description instanceof Array ? description : false;

  if(amount && currency && source && email && description) {
    try {
      const charge = await stripe.charges.create({
        amount: Math.round(amount*100),
        currency: currency,
        source: source,
        receipt_email: email,
        description: JSON.stringify(description)
      });
      return charge;
    } catch(e) {
      console.log(e);
      return 'error';
    };
  } else {
    return false;
  };
};

// Send email to customer
helpers.sendEmail = async (toEmail, subject, text) => {
  toEmail = typeof(toEmail) === 'string' && toEmail.trim().length > 5 ? toEmail.trim() : false;
  subject = typeof(subject) === 'string' && subject.trim().length > 3 ? subject.trim() : false;
  text = typeof(text) === 'string' && text.trim().length > 0 ? text.trim() : false;

  if(toEmail && subject && text) {
    // Logic to send the email
    const data = {
      'from': `test@${config.mailGun.domain}`,
      'to': toEmail,
      'subject': subject,
      'text': text
    };

    mailGun.messages().send(data, (err, body) => {
      if(err) {
        console.log(err);
      };
    });

  } else {
    console.log('Send email parameter(s) were not valid');
  };
};


module.exports = helpers;
