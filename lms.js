/* eslint-disable no-unused-vars */
const { User } = require('./models')
const express = require('express')
const csrf = require('tiny-csrf')
const lms = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path')
const passport = require('passport')
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const flash = require('connect-flash')
lms.set('views', path.join(__dirname, 'views'))
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')

const saltRounds = 10

lms.use(flash())
lms.use(bodyParser.json())
lms.use(express.urlencoded({ extended: false }))
lms.use(cookieParser('shh!some secret string,I am King'))
lms.use(csrf('abcdefghijklmnopqrstuvwxyz123456', ['POST', 'PUT', 'DELETE']))
lms.set('view engine', 'ejs')
lms.use(express.static(path.join(__dirname, 'public')))

lms.use(
  session({
    secret: 'my-super-secret-key-21728172615261562',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000
    }
  })
)

lms.use(function (request, response, next) {
  response.locals.messages = request.flash()
  next()
})

lms.use(passport.session())
lms.use(passport.initialize())

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password)
          if (result) {
            return done(null, user)
          } else {
            return done(null, false, { message: 'Invalid password' })
          }
        })
        .catch((error) => {
          return done(error)
        })
    }
  )
)

passport.serializeUser((user, done) => {
  console.log('Serializing user in session', user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user)
    })
    .catch((error) => {
      done(error, null)
    })
})

lms.get('/', async (request, response) => {
  response.render('index.ejs')
})

lms.get('/signup', function (request, response) {
  response.render('signup.ejs', {
    csrfToken: request.csrfToken()
  })
})

lms.post('/users', async function (request, response) {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  console.log(hashedPwd)

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect('/todos')
    })
  } catch (error) {
    request.flash('error', 'FirstName & E-Mail cannot be empty!')
    console.log(error)
    response.redirect('/signup')
  }
})

module.exports = lms
