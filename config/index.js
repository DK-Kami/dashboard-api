const { DBConfig } = require('./.secret_db.js');
const config = {};

config.PORT = process.env.PORT || 5000;
config.DB = DBConfig;

config.CONNECTION_STRING = `${config.DB.sertificate}://${config.DB.userName}:${config.DB.password}@${config.DB.dbName}.w2d7e.mongodb.net/${config.DB.dbName}?retryWrites=true&w=majority`;

module.exports = config;
