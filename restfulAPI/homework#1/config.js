// Container for environment config
const environments = {};

// Development environment
environments.development = {
  'port': 3000,
  'envName': 'development'
};

// Production environment
environments.production = {
  'port': 5000,
  'envName': 'production'
}

// Determine the environment which is passed in the terminal
const curEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check to make sure the environment is one of the env from above. If not default to development
const envToExport = typeof(environments[curEnv]) === 'object' ? environments[process.env.NODE_ENV] : environments.development;

module.exports = envToExport;
