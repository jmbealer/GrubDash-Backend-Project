const router = require("express").Router();
const controller = require("./dishes.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

router
  .route("/")
  // make a get request that uses list()
  .get(controller.list)
  // make a post request that uses create() to create a new dish
  .post(controller.create)
  // catch the request types that arent available to use on dish
  .all(methodNotAllowed)

router
  .route("/:dishId")
  // make a get request that uses read()
  .get(controller.read)
  // make a put request that uses update() to update a dish
  .put(controller.update)
  .all(methodNotAllowed)

module.exports = router;
