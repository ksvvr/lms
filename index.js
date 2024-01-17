const lms = require("./lms");

lms.listen(4000, () => {
  console.log("Started express server at port 4000");
});
