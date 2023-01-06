import * as functions from "@google-cloud/functions-framework";

// Register an HTTP function with the Functions Framework
functions.http("chk1", (req, res) => {
  // Your code here

  // Send an HTTP response
  res.send("OK");
});
