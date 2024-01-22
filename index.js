const lms = require('./routes/lms')

lms.listen(2000, () => {
  console.log('Started express server at port 2000')
})
