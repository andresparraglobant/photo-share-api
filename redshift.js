//redshift.js
var Redshift = require('node-redshift');
 
var client = {
  user: process.env.DW_USER,
  database: process.env.DW_DATABASE,
  password: process.env.DW_PASSWORD,
  port: process.env.DW_PORT,
  host: process.env.DW_HOST,
};
 
// The values passed in to the options object will be the difference between a connection pool and raw connection
var redshiftClient = new Redshift(client);
 
module.exports = redshiftClient;