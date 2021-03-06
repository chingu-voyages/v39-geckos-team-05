'use strict';

require('dotenv').config(); // to utilize .env file
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/seqConfig.js')[env];
const db = {};
// console.log("[index.js config check] " , require(__dirname + '/../config/seqConfig.js'), `  ${env}`)
// console.log("[index.js config check] " , JSON.stringify(config))
// don't want to pluralize table name
config.define = {"freezeTableName" : true}

// ssl option is only enabled for the remote database
if( env !== 'development')
{
  config.dialectOptions = {ssl: {
    require: true,
    rejectUnauthorized: false, // very important
  }}
}        
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
//  console.log("[model debug] : ", sequelize)
module.exports = db;
