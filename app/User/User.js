const mongoose = require('mongoose');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Accounts = require('../Accounts/Accounts');
const InfoType = require('../InfoType/InfoType');
const AccountUser = require('./AccountUser');
const InfoUser = require('./InfoUser');

const UserModel = new mongoose.Schema({
  nickname: { type: String, unique: true, minlength: 3, required: true },
  email: { type: String, unique: true, minlength: 3, required: true, match: [/\S+@\S+\.\S+/, 'is invalid'] },
  url: { type: String, unique: true },
  origin: String,
  hash: String,
  salt: String,
  url: String,
});

UserModel.methods.generateLink = function() {
  const host = 'http://localhost:8080/fs/';
  const date = (new Date()).valueOf().toString();
  const random = Math.random().toString();
  const hash = crypto.createHash('sha1').update(date + random).digest('hex');
  this.origin = hash;
  this.url = host + hash + '/' + this.nickname;
};

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
  const avatar = gravatar.url(this.email, { s: 200 });
  return {
    _id: this._id,
    nickname: this.nickname,
    email: this.email,
    url: this.url,
    avatar,
    token: this.generateJWT(),
  };
};
UserModel.methods.getProfile = async function(callback) {
  const accountUsers = await AccountUser.find({ user: this._id });
  const infoUsers = await InfoUser.find({ user: this._id });

  const accounts = await getAllById(Accounts, accountUsers, 'account');
  const info = await getAllById(InfoType, infoUsers, 'type');

  await Promise.all(info, accounts);

  // const avatar = gravatar.url(this.email, { s: 200 });
  const avatar = gravatar.url('1.dankon.1@gmail.com', { s: 200 });

  return callback(null, {
    _id: this._id,
    nickname: this.nickname,
    email: this.email,
    url: this.url,
    avatar,
    // accounts: accounts.map(getCurrentArray(accountUsers, 'account')),
    accounts: [
      
    ],
    info: {
      specialisations: [
        { _id: 1, name: 'Frontend' },
        { _id: 2, name: 'Backend' },
      ],
      technologies: [
        { _id: 1, name: 'JS' },
        { _id: 2, name: 'HTML' },
        { _id: 2, name: 'CSS' },
        { _id: 2, name: 'C#' },
      ],
      educations: [
        { _id: 1, name: 'Ebaniy rot', years: '2008 - 2012', position: 'Web-developer', photo: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fmemepedia.ru%2Febanyj-rot-etogo-kazino%2F&psig=AOvVaw2XtpULLVv5JfBEIJ9Qg5Vc&ust=1630858778629000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCKDvpMTc5fICFQAAAAAdAAAAABAD' },
      ],
      work: [
        { _id: 1, name: 'Tetris Co', years: '2012 - 2019', position: 'Web-developer', photo: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.facebook.com%2FTetriscreativethemes%2F&psig=AOvVaw2LXF1Qc1CEZsHIs_ZrSFTB&ust=1630858891653000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCJC3xfzc5fICFQAAAAAdAAAAABAD' },
        { _id: 2, name: 'Pocky', years: '2019 - now', position: 'Backend developer', photo: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.sima-land.ru%2F4387883%2Fpalochki-pocky-glico-v-shokolade-47-g%2F&psig=AOvVaw2gm-obF8ihENTVz1NpUhWU&ust=1630858874458000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCLi--PLc5fICFQAAAAAdAAAAABAD' },
      ]
    },
    // info: info.map(getCurrentArray(infoUsers, 'type')),
  });
};

async function getAllById(className, array, value) {
  const ids = array.map(i => i[value]);
  return await className.find({ _id: { $in: ids } });
};
function getCurrentArray(array, value) {
  return item => {
    const current = array.find(c => c[value].toString() === item._id.toString());
    if (!current) return;
    return {
      ...item._doc,
      value: current.value,
    }
  };
};

mongoose.model('NewUser', UserModel);

module.exports = mongoose.model('NewUser');
