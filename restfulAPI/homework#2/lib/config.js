/* Create and export configuration variables */

// Container for all environments
const environments = {};

// Development (default)
environments.development = {
  'httpPort': 3000,
  // 'httpsPort': 3001,
  'envName': 'development',
  'hashingSecret': 'thisIsASecret',
  'stripe': {
    'publishable': '',
    'secret': ''
  },
  'mailGun': {
    'private': '',
    'public': '',
    'domain': ''
  }
};

// Production
environments.production = {
  'httpPort': 5000,
  // 'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsASecret',
  'stripe': {
    'publishable': '',
    'secret': ''
  },
  'mailGun': {
    'private': '',
    'public': '',
    'domain': ''
  }
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'development' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments from above, if not default to 'development'
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.development;

module.exports = environmentToExport;
