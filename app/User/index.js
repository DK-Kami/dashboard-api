const router = require('express').Router();
const passport = require('passport');
const auth = require('../router/auth');
const User = require('./User');

router.get('/api/profile', auth.required, async (req, res) => {
  const { id } = req.payload;

  const user = await User.findById(id);
  if(!user) {
    return res.sendStatus(400);
  }

  return res.json({ user: user.getProfile() });
});

router.post('/register', auth.optional, (req, res) => {
  const { email, password } = req.body;

  if(!email) {
    return res.status(400).send({
      error: 'Логин является обязательным полем',
    });
  }

  if(!password) {
    return res.status(400).sned({
      error: 'Пароль является обязательным полем',
    });
  }

  try {
    const finalUser = new User({ email, password });
    finalUser.setPassword(password);

    return finalUser.save()
      .then(() => res.json({ user: finalUser.toAuthJSON() }));
  }
  catch(e) {
    res.status(422).send(e);
  }
});

router.post('/login', auth.optional, (req, res, next) => {
  const { email, password } = req.body;

  if(!email) {
    return res.status(400).send({
      error: 'Логин является обязательным полем',
    });
  }

  if(!password) {
    return res.status(400).send({
      error: 'Пароль является обязательным полем',
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser) => {
    if(err) {
      console.log(err.error);
      return res.status(401).send(err);
    }

    if(passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json({ user: user.toAuthJSON() });
    }

    return next(res.status(401));
  })(req, res, next);
});

module.exports = router;