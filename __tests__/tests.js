/* eslint-disable no-undef */
const request = require('supertest')
const cheerio = require('cheerio')

const db = require('../models/index')
const lms = require('../routes/lms')

let server, agent

function extractCsrfToken (res) {
  const $ = cheerio.load(res.text)
  return $('[name=_csrf]').val()
}

beforeAll(async () => {
  await db.sequelize.sync({ force: true })
  server = lms.listen(2000, () => {})
  agent = request.agent(server)
})

afterAll(async () => {
  try {
    await db.sequelize.close()
    await server.close()
  } catch (error) {
    console.log(error)
  }
})

describe('Educator Test Suite', () => {
  test('SignUp an Educator', async () => {
    let res = await agent.get('/signup')
    const csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Test',
      lastName: 'UserA',
      email: 'user.a@test.com',
      password: '12345678',
      isEducator: 'true',
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302)
  })

  test('Educator - Add Course', async () => {
    const res = await agent.get('/educator-dashboard')
    const csrfToken = extractCsrfToken(res)
    const addCourseRes = await agent.post('/addCourse').send({
      name: 'New Test Course',
      description: 'Course Description',
      _csrf: csrfToken
    })
    expect(addCourseRes.statusCode).toBe(302)
  })

  test('Educator - Add Chapter', async () => {
    const courseId = 1
    const res = await agent.get(`/course/${courseId}`)
    const csrfToken = extractCsrfToken(res)
    const addChapterRes = await agent.post('/addChapter').send({
      name: 'New Chapter',
      description: 'Chapter Description',
      courseId,
      _csrf: csrfToken
    })
    expect(addChapterRes.statusCode).toBe(302)
  })

  test('Educator - Add Page', async () => {
    const chapterId = 1
    const res = await agent.get(`/chapter/${chapterId}`)
    const csrfToken = extractCsrfToken(res)
    const addPageRes = await agent.post('/addPage').send({
      title: 'New Page',
      content: 'Page ContentPage ContentPage ContentPage Content',
      chapterId,
      _csrf: csrfToken
    })
    expect(addPageRes.statusCode).toBe(302)
  })

  test('Educator View Reports', async () => {
    const res = await agent.get('/educator/reports')
    expect(res.statusCode).toBe(200)
  })

  test('Educator Change Password', async () => {
    const res = await agent.get('/changepassword')
    const csrfToken = extractCsrfToken(res)
    const changePasswordRes = await agent.post('/changepassword').send({
      currentPassword: '12345678',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
      _csrf: csrfToken
    })
    expect(changePasswordRes.statusCode).toBe(302)
  })

  test('Educator Signout', async () => {
    const res = await agent.get('/signout')
    expect(res.statusCode).toBe(302)
  })

  test('Educator Login', async () => {
    const res = await agent.get('/login')
    const loginCsrfToken = extractCsrfToken(res)
    const postLogin = await agent.post('/session').send({
      email: 'user.a@test.com',
      password: '12345678',
      _csrf: loginCsrfToken
    })
    expect(postLogin.statusCode).toBe(302)
  })

  test('Educator Signout Post-login', async () => {
    const res = await agent.get('/signout')
    expect(res.statusCode).toBe(302)
  })

  test('Sample Test', () => {
    expect(true).toBe(true)
  })
})

describe('Student Test Suite', () => {
  test('SignUp a Student', async () => {
    let res = await agent.get('/signup')
    const csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Test',
      lastName: 'UserB',
      email: 'user.b@test.com',
      password: '12345678',
      isEducator: 'false',
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302)
  })

  test('View courses and chapters without enrolling', async () => {
    const res = await agent.get('/student-dashboard')
    expect(res.statusCode).toBe(200)
    // Add assertions based on the response to ensure correct rendering of courses and chapters
  })

  test('Enroll in course', async () => {
    // eslint-disable-next-line no-unused-vars
    const res = await agent.get('/mycourses')
    const courseId = 1 // Replace with a valid course ID
    const enrollRes = await agent.get(`/enroll/${courseId}`)
    expect(enrollRes.statusCode).toBe(302)
  })

  test('Mark page as complete', async () => {
    const pageId = 1
    // eslint-disable-next-line no-unused-vars
    const res = await agent.get(`/pages/${pageId}?courseId=1`)
    const csrfToken = extractCsrfToken(res)
    const markCompleteRes = await agent.post(`/markAsComplete/${pageId}`).send({
      courseId: 1,
      _csrf: csrfToken
    })
    expect(markCompleteRes.statusCode).toBe(200)
    // Add assertions based on the response to ensure successful completion marking
  })

  test('View course progress', async () => {
    const res = await agent.get('/course-status/1') // Replace with a valid course ID
    expect(res.statusCode).toBe(200)
    // Add assertions based on the response to ensure correct rendering of course progress
  })

  test('Change password', async () => {
    const res = await agent.get('/changepassword')
    const csrfToken = extractCsrfToken(res)
    const changePwdRes = await agent.post('/changepassword').send({
      currentPassword: '12345678',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
      _csrf: csrfToken
    })
    expect(changePwdRes.statusCode).toBe(302)
  })

  test('Signout', async () => {
    const res = await agent.get('/signout')
    expect(res.statusCode).toBe(302)
  })

  test('Sample Test', () => {
    expect(true).toBe(true)
  })
})
