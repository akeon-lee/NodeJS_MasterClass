// Library for storing and editing data

// Dependencies
const fs = require('fs');
const path = require('path');

const helpers = require('./helpers');

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to the file
lib.create = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      // Convert data to a string
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if(err) {
          callack('Error writing to file')
        }

        fs.close(fileDescriptor, (err) => {
          if(err) {
            callback('Error closing new file')
          }
          callback(false);
        });
      })
    } else {
      callback('Could not create new file, it may already exist');
    }
  });
};

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf-8', (err, data) => {
    if(!err && data) {
      const parsedData = helpers.parseJSONToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update data from an existing file
lib.update = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      // Convert data to a string
      const stringData = JSON.stringify(data);

      // Truncate the contents of the file
      fs.truncate(fileDescriptor, (err) => {
        if(err) {
          callback('Error truncating file');
        }

        // Write to the file and close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if(err) {
            callback('Error writing to existing file');
          }

          fs.close(fileDescriptor, (err) => {
            if(err) {
              callback('Error with closing existing file');
            }
            callback(false);

          });

        });
      });

    } else {
      callback('Could not open the file for opening, it may not exist yet')
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
    if(err) {
      callback('Error deleting the file');
    }
    callback(false);

  });
};

// List all the items in a directory
lib.list = (dir, callback) => {
  fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
    if(!err && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach(fileName => {
        trimmedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

module.exports = lib;
