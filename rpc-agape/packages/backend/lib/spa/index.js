module.exports = function reactAppMiddleware() {
  return new Promise((res, rej) => {
    try {
      const express = require("express");
      const router = express.Router();

      router.get("*", (req, res) => res.send("Not Found SPA"));

      res(router);
    } catch (error) {
      rej(error);
    }
  });
};


module.exports.pages = [];