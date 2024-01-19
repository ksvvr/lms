/* eslint-disable no-unused-vars */
const { User, Course, Chapter, Page } = require('./models')
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
  if (request.isAuthenticated()) {
    return response.redirect('/dashboard')
  }
  response.render('index', {
    csrfToken: request.csrfToken()
  })
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
      response.redirect('/dashboard')
    })
  } catch (error) {
    request.flash('error', 'FirstName & E-Mail cannot be empty!')
    console.log(error)
    response.redirect('/signup')
  }
})

lms.post(
  '/addCourse',
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Course.addCourse({
        name: request.body.name,
        description: request.body.description,
        userId: request.user.id
      })
      return response.redirect('/dashboard')
    } catch (error) {
      console.log(error)
      request.flash('error', 'Course Name Needed')
      return response.redirect('/dashboard')
    }
  }
)

lms.post(
  '/addChapter',
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const courseId = request.body.courseId
    try {
      await Chapter.addChapter({
        name: request.body.name,
        description: request.body.description,
        courseId: request.body.courseId
      })
      return response.redirect(`/course/${courseId}`)
    } catch (error) {
      console.log(error)
      request.flash('error', 'Cannot Add Chapter')
      return response.redirect(`/course/${courseId}`)
    }
  }
)

lms.get(
  '/dashboard',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const dt = new Date().toISOString().split('T')[0]
    const allCourses = await Course.getCourses(request.user.id)
    const courses = []
    const userDetail = request.user.firstName + ' ' + request.user.lastName

    await allCourses.forEach((i) => {
      courses.push(i)
    })
    if (request.accepts('html')) {
      response.render('dashboard.ejs', {
        courses,
        userDetail,
        csrfToken: request.csrfToken()
      })
    } else {
      response.json({
        courses
      })
    }
  }
)

lms.get('/signout', (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err)
    }
    response.redirect('/')
  })
})

lms.post(
  '/session',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  function (request, response) {
    console.log(request.user)
    response.redirect('/dashboard')
  }
)

lms.get('/login', (request, response) => {
  response.render('login', {
    csrfToken: request.csrfToken()
  })
})

lms.get('/course/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const allChapters = await Chapter.getChapters(request.params.id)
    const chapters = []
    await allChapters.forEach((i) => {
      chapters.push(i)
    })
    response.render('course', {
      chapters,
      courseId: request.params.id,
      csrfToken: request.csrfToken()
    })
  })

module.exports = lms
