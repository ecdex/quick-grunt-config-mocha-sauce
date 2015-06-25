/*jshint expr:true*/

/*globals driver: true */
driver = null;

/*globals selenium: true */
selenium = null;

require("should");
selenium = require("selenium-webdriver/testing");
var helpers = require("./test_helpers");


// some exceptions from inside webdriver.js operations were getting
// eaten by the absence of an error callback, so this function is
// intended to be used as the error handler in a driver.next() call
// or in the terminal .next() of a webdriver promise chain.  Forces
// the exception to force at test failure, sometimes at the cost of
// printing duplicate stack traces.
//
/*globals failTestOnError: true */
failTestOnError = function (err) {
  console.log("  -------->  FAILED");
  console.log(err.stack);
  err.message.should.equal("");   // force test failure with mismatch printing message
};

selenium.before(function () {
  var browserName = helpers.getBrowserName();

  //  -- for debug
  //driver = helpers.getChromeWithVerboseLogging();
  //return;

  if (process.env.INTEGRATION_CLIENTS_LOCATION === "sauce") {
    driver = helpers.getSauce();     // browser config from environment
  } else {   // "local"
    driver = helpers.getWebdriver(browserName);
  }
});

selenium.after(function () {
  var browserName = helpers.getBrowserName();
  helpers.failIfWebdriverBrowserLogContainsErrors(browserName);
  driver
      .quit()
      .then(null, function (err) { failTestOnError(err); });
});
