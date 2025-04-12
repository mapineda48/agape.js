const _ = require("lodash");

const obj = {};

_.set(obj, [], null);


console.log(obj);
console.log(_.get(obj,[]));