/* eslint-disable no-unused-vars */
const { User, Course, Chapter, Page, Enrollment, Completion } = require('../models')
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
lms.set('views', path.join(__dirname, '../views'))
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')

const saltRounds = 10

lms.use(flash())
lms.use(bodyParser.json())
lms.use(express.urlencoded({ extended: false }))
lms.use(cookieParser('shh!some secret string,I am King'))
lms.use(csrf('abcdefghijklmnopqrstuvwxyz123456', ['POST', 'PUT', 'DELETE']))
lms.set('view engine', 'ejs')
lms.use(express.static(path.join(__dirname, '../public')))

lms.use(
  session({
    secret: 'my-super-secret-key-21728172615261562',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000
    }
  })
)

lms.use(function (request, response, next) {
  response.locals.messages = request.flash()
  next()
})

lms.use(passport.initialize())
lms.use(passport.session())

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
            return done(null, false, { message: 'Invalid Credentials, Try Again!' })
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

lms.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
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
  // console.log(hashedPwd)
  let isEducator = false

  if (request.body.isEducator === 'true') {
    isEducator = true
  }

  try {
    const pas = request.body.password
    if (pas.length < 8) {
      request.flash('error', 'Password Length MIN 8')
      return response.redirect('/signup')
    }
    if (await User.findOne({
      where: {
        email: request.body.email
      }
    })) {
      request.flash('error', 'E-mail ID already used!')
      return response.redirect('/signup')
    }
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      isEducator
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect('/dashboard')
    })
  } catch (error) {
    request.flash('error', 'FirstName, E-Mail and Password(min len 8) cannot be empty!')
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
      request.flash('success', 'New Course added successfully!')
      return response.redirect('/educator-dashboard')
    } catch (error) {
      console.log(error)
      request.flash('error', 'Course Name and Description Needed, and Both of Length More Than or Equal to 5')
      return response.redirect('/educator-dashboard')
    }
  }
)

lms.post(
  '/addChapter',
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const addingEducator = request.user.id
    const courseId = request.body.courseId
    const course = await Course.getCourse(courseId)
    if (course[0].userId !== addingEducator) {
      request.flash('error', 'You are not Authorized to Add Chapters!')
      return response.redirect(`/course/${courseId}`)
    }
    try {
      await Chapter.addChapter({
        name: request.body.name,
        description: request.body.description,
        courseId: request.body.courseId
      })
      request.flash('success', 'New Chapter Added Successfully!')
      return response.redirect(`/course/${courseId}`)
    } catch (error) {
      console.log(error)
      request.flash('error', 'Chapter Name and Description Needed, and both of length more than or equal to 5')
      return response.redirect(`/course/${courseId}`)
    }
  }
)

lms.post(
  '/addPage',
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const chapterId = request.body.chapterId
    try {
      const courseId = (await Chapter.findByPk(chapterId)).courseId
      const courseOwner = (await Course.findByPk(courseId)).userId
      if (courseOwner !== request.user.id) {
        request.flash('error', 'You cannot add pages to this course!')
        return response.redirect(`/chapter/${chapterId}`)
      }
      await Page.addPage({
        title: request.body.title,
        content: request.body.content,
        chapterId: request.body.chapterId
      })
      request.flash('success', 'New Page Added Successfully!')
      return response.redirect(`/chapter/${chapterId}`)
    } catch (error) {
      console.log(error)
      request.flash('error', 'Page Title(min length is 5) and Content(min length is 30) Needed! ')
      return response.redirect(`/chapter/${chapterId}`)
    }
  }
)

lms.get(
  '/dashboard',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.isEducator) {
      return response.redirect('/educator-dashboard'
      )
    } else {
      return response.redirect('/student-dashboard'
      )
    }
  }
)

lms.get(
  '/educator-dashboard',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (!request.user.isEducator) {
      return response.redirect('/dashboard')
    }
    const allCoursesOnLMS = await Course.getAllCourses()
    const allCourseOnLms = []
    allCoursesOnLMS.forEach(i => {
      if (i.userId !== request.user.id) {
        allCourseOnLms.push(i)
      }
    })
    const allCourses = await Course.getCourses(request.user.id)
    const courses = []
    const userDetail = request.user.firstName + ' ' + request.user.lastName

    await allCourses.forEach((i) => {
      courses.push(i)
    })
    if (request.accepts('html')) {
      response.render('dashboard.ejs', {
        courses,
        request,
        allCourses: allCourseOnLms,
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

lms.get(
  '/student-dashboard',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.isEducator) {
      return response.redirect('/dashboard')
    }
    const allCourses = await Course.getAllCourses()
    const courses = []
    const userDetail = request.user.firstName + ' ' + request.user.lastName

    await allCourses.forEach((i) => {
      courses.push(i)
    })
    if (request.accepts('html')) {
      response.render('studentdashboard.ejs', {
        courses,
        request,
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
    request.flash('success', 'User Signed Out Successfully!')
    return response.redirect('/')
  })
})

lms.post(
  '/session',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  function (request, response) {
    // console.log(request.user)
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
    if (!request.user.isEducator) {
      const parameterr = request.params.id
      return response.redirect(`/courses/${parameterr}`)
    }
    const course = await Course.getCourse(request.params.id)
    const allChapters = await Chapter.getChapters(request.params.id)
    const chapters = []
    await allChapters.forEach((i) => {
      chapters.push(i)
    })
    response.render('course', {
      chapters,
      request,
      course,
      courseId: request.params.id,
      csrfToken: request.csrfToken()
    })
  })

lms.get('/chapter/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (!request.user.isEducator) {
      const parameterr = request.params.id
      return response.redirect(`/chapters/${parameterr}`)
    }
    const chapter = await Chapter.findByPk(request.params.id)
    const course = await Course.findByPk(chapter.courseId)
    const allPages = await Page.getPages(request.params.id)
    const pages = []
    await allPages.forEach((i) => {
      pages.push(i)
    })
    response.render('chapter', {
      pages,
      chapter,
      course,
      request,
      chapterId: request.params.id,
      csrfToken: request.csrfToken()
    })
  })

lms.get('/enroll/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.isEducator) {
      return response.redirect('/dashboard')
    }
    const user = request.user.id
    const course = request.params.id
    if (await Enrollment.findOne({
      where: {
        userId: user,
        courseId: course
      }
    }) != null) {
      request.flash('error', 'Already enrolled in the course!')
      return response.redirect('/mycourses')
    }
    try {
      await Enrollment.newEnroll({
        userId: user,
        courseId: course
      })
      request.flash('success', 'Successfully Enrolled in the Course!')
      return response.redirect('/mycourses')
    } catch (error) {
      console.log(error)
      request.flash('error', 'Cannot Enroll in the Course, Try Later...')
      return response.redirect('/mycourses')
    }
  })

lms.get('/mycourses',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.isEducator) {
      return response.redirect('/dashboard')
    }
    const coursess = Object.values(await Enrollment.getCourses(request.user.id))
    const courses = []
    for (const enrollment of coursess) {
      console.log(enrollment.dataValues.courseId)
      const course = await Course.findByPk(enrollment.dataValues.courseId)
      courses.push(course)
    }
    // console.log(courses)
    return response.render('mycourses', {
      courses,
      request,
      csrfToken: request.csrfToken()
    })
  })

lms.get('/courses/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.isEducator) {
      const parameterr = request.params.id
      return response.redirect(`/course/${parameterr}`)
    }
    const allChapters = await Chapter.getChapters(request.params.id)
    const chapters = []
    const course = await Course.getCourse(request.params.id)
    const status = await Enrollment.findOne({
      where: {
        userId: request.user.id,
        courseId: request.params.id
      }
    })
    await allChapters.forEach((i) => {
      chapters.push(i)
    })
    response.render('courses', {
      course,
      status,
      request,
      chapters,
      courseId: request.params.id,
      csrfToken: request.csrfToken()
    })
  })

lms.get('/chapters/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.isEducator) {
      const parameterr = request.params.id
      return response.redirect(`/chapter/${parameterr}`)
    }
    const allPages = await Page.getPages(request.params.id)
    const chapter = await Chapter.findByPk(request.params.id)
    const course = await Course.findByPk(chapter.courseId)
    const pages = []
    await allPages.forEach((i) => {
      pages.push(i)
    })
    response.render('chapters', {
      pages,
      request,
      chapter,
      course,
      courseId: request.query.courseId,
      chapterId: request.params.id,
      csrfToken: request.csrfToken()
    })
  })

lms.get('/pages/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const page = await Page.getPage(request.params.id)
    const courseId = request.query.courseId
    const course = await Course.findByPk(courseId)
    const chapter = await Chapter.findByPk(page.chapterId)
    if (await Enrollment.findOne({
      where: {
        userId: request.user.id,
        courseId
      }
    }) !== null) {
      let isComplete = false
      if (await Completion.findOne({
        where: {
          userId: request.user.id,
          pageId: page.id
        }
      }) !== null) {
        isComplete = true
      }
      return response.render('page', {
        page,
        request,
        course,
        chapter,
        courseId,
        isComplete,
        csrfToken: request.csrfToken()
      })
    } else {
      request.flash('error', 'You have to enroll in the course to view the pages! Go back to course and Enroll...')
      return response.redirect(`/chapters/${chapter.id}?courseId=${course.id}`)
    }
  }
)

lms.post('/markAsComplete/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const courseId = request.body.courseId
    const pageId = request.body.pageId
    if (request.user.isEducator) {
      return response.redirect('/dashboard')
    }
    try {
      const pageId = request.body.pageId
      const userId = request.user.id
      const enrollment = await Enrollment.findOne({
        where: {
          userId,
          courseId: request.body.courseId
        }
      })
      if (!enrollment) {
        request.flash('error', 'You must be enrolled in the course to mark pages as complete.')
        return response.redirect('/mycourses')
      }
      await Completion.create({
        userId,
        pageId
      })
      request.flash('success', 'Page marked as Complete!')
      return response.redirect(`/pages/${pageId}?courseId=${courseId}`)
    } catch (error) {
      console.error('Error marking page as complete:', error)
      request.flash('error', 'Error marking page as complete.')
      return response.redirect('/mycourses')
    }
  }
)

lms.get('/changepassword',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => {
    res.render('changepassword', {
      csrfToken: req.csrfToken(),
      request: req
    })
  })

lms.post('/changepassword',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const userId = req.user.id
      const { currentPassword, newPassword, confirmPassword } = req.body

      const user = await User.findByPk(userId)
      if (!user || !(await user.comparePassword(currentPassword))) {
        req.flash('error', 'Incorrect current password')
        return res.redirect('/changepassword')
      }

      if (newPassword !== confirmPassword) {
        req.flash('error', 'New password and confirm password do not match')
        return res.redirect('/changepassword')
      }

      if (newPassword.length < 8) {
        req.flash('error', 'New password length must be minimum 8 characters!')
        return res.redirect('/changepassword')
      }

      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
      await User.update({ password: hashedPassword }, { where: { id: req.user.id } })

      req.flash('success', 'Password changed successfully')
      if (req.user.isEducator) {
        return res.redirect('/educator-dashboard')
      }
      return res.redirect('/student-dashboard')
    } catch (error) {
      console.error('Error changing password:', error)
      req.flash('error', 'Error changing password, try again later!')
      res.redirect('/changepassword')
    }
  })

lms.get('/educator/reports',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      if (!req.user.isEducator) {
        res.redirect('/dashboard')
      }
      const userId = req.user.id
      const courses = await Course.findAll({
        where: { userId },
        include: [
          {
            model: Enrollment,
            attributes: [['courseId', 'courseid']]
          }
        ]
      })

      const courseReports = courses.map(course => ({
        courseId: course.id,
        courseName: course.name,
        enrollmentCount: course.Enrollments.length
      }))

      courseReports.sort((a, b) => b.enrollmentCount - a.enrollmentCount)

      res.render('reports', { user: req.user, courseReports, request: req })
    } catch (error) {
      console.error('Error retrieving educator reports:', error)
      res.status(500).send('<script src="https://cdn.tailwindcss.com"></script>Internal Server Error, <p class="mt-2"><a href="javascript:void(0);" onclick="window.close();" class="bg-lime-300">Close Tab</a></p>')
    }
  })

lms.get('/course-status/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.isEducator) {
      res.redirect('/dashboard')
    }
    try {
      const courseId = req.params.id
      const userId = req.user.id
      const course = await Course.findByPk(courseId, {
        include: [
          {
            model: Chapter,
            include: {
              model: Page,
              attributes: ['id', 'title'],
              include: {
                model: Completion,
                attributes: ['id'],
                where: { userId },
                required: false
              }
            },
            attributes: ['id', 'name']
          }
        ]
      })

      if (!course) {
        return res.status(404).send('<script src="https://cdn.tailwindcss.com"></script>Course not found, <p class="mt-2"><a href="javascript:void(0);" onclick="window.close();" class="bg-lime-300">Close Tab</a></p>')
      }

      const totalPages = course.Chapters.reduce((acc, chapter) => acc + chapter.Pages.length, 0)
      const completedPages = course.Chapters.reduce((acc, chapter) => acc + chapter.Pages.filter(page => page.Completions.length > 0).length, 0)
      const completionPercentage = totalPages > 0 ? (completedPages / totalPages) * 100 : 0

      res.render('coursestatus', { user: req.user, course, completionPercentage, request: req })
    } catch (error) {
      console.error('Error retrieving course information:', error)
      res.status(500).send('<script src="https://cdn.tailwindcss.com"></script>Internal Server Error, <p class="mt-2"><a href="javascript:void(0);" onclick="window.close();" class="bg-lime-300">Close Tab</a></p>')
    }
  })

lms.get('*', (req, res) => {
  return res.render('error')
})

module.exports = lms
