const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Accounts = require('../Accounts/Accounts');
const InfoType = require('../InfoType/InfoType');

const UserModel = new mongoose.Schema({
  nickname: { type: String, unique: true, minlength: 3, required: true },
  email: { type: String, unique: true, minlength: 3, required: true, match: [/\S+@\S+\.\S+/, 'is invalid'] },
  accounts: [{
    type: { type: mongoose.Schema.ObjectId, ref: 'Accounts', required: true, unique: true },
    value: { type: String, required: true },
  }],
  info: [{
    type: { type: mongoose.Schema.ObjectId, ref: 'InfoTypes', required: true, unique: true },
    value: { type: String, required: true },
  }],
  hash: String,
  salt: String,
});

UserModel.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserModel.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UserModel.methods.generateJWT = function() {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign({
    email: this.email,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
  }, 'secret');
}

UserModel.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    email: this.email,
    nickname: this.nickname,
    token: this.generateJWT(),
  };
};
UserModel.methods.getProfile = async function(callback) {
  console.log(this.accounts);
  const accounts = await getAllById(Accounts, this.accounts);
  const info = await getAllById(InfoType, this.info);

  await Promise.all(info, accounts);

  return callback(null, {
    _id: this._id,
    nickname: this.nickname,
    email: this.email,
    accounts: accounts.map(getCurrentArray(this.accounts)),
    info: info.map(getCurrentArray(this.info)),
  });
};

async function getAllById(className, array) {
  const ids = array.map(i => i.type);
  return await className.find({ _id: { $in: ids } });
};
function getCurrentArray(array) {
  return item => {
    const current = array.find(c => c.type.toString() === item._id.toString());
    if (!current) return;
    return {
      ...item._doc,
      value: current.value,
    }
  };
};

mongoose.model('User', UserModel);

module.exports = mongoose.model('User');
