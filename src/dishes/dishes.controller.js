const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Validation Handlers

// middleware to check if the dish has an name.
// needed for "create()" and "update()".
function bodyHasName(req, res, next) {
  // deconstruct name from request body.
  const { data: { name } = {} } = req.body
  // if name is truthy, move request to next function
  if (name) {
    // setting response locals
    res.locals.name = name
    return next()
  } else {
    // if no name, stop execution and return object
    // with error 'status' code and message.
    next({
      status: 400,
      message: `A 'name' property is required.`,
    })
  }
}

// middleware to check if the dish has a description.
// needed for "create()" and "update()".
function bodyHasDescription(req, res, next) {
  // deconstruct description from request body.
  const {  data: { description } = {} } = req.body
  // if description is truthy, move request to next function
  if (description) {
    // setting response locals
    res.locals.description = description
    return next()
  } else {
    next({
      status: 400,
      message: `A 'description' property is required.`,
    })
  }
}

// middleware to check if the dish has a price.
// needed for "create()" and "update()".
function bodyHasPrice(req, res, next) {
  // deconstruct price from request body
  const {  data: { price } = {} } = req.body
  // if price is truthy, move request to next function
  if (price) {
    // setting response locals
    res.locals.price = price
    return next()
  } else {
    next({
      status: 400,
      message: `A 'price' property is required.`,
    })
  }
}

// middleware to check if dish price is valid
// needed for "create()".
function bodyHasValidPrice(req, res, next) {
  // deconstruct price from request body
  const {  data: { price } = {} } = req.body
  // if price is greater than 0, move request to next function
  if (price > -1) {
    // setting response locals
    res.locals.price = price
    return next()
  } else {
    next({
      status: 400,
      message: `price cannot be less than 0.`,
    })
  }
}

// middleware to check if dish price is valid for 'update()'.
function bodyHasValidPriceUpdate(req, res, next) {
  // deconstruct price from request body
  const {  data: { price } = {} } = req.body
  // if response locals price is less than or equal to 0
  // OR response locals price type is not number
  // return error status code with message.
  if (res.locals.price <= 0 || typeof res.locals.price !== "number") {
    next({
      status: 400,
      message: `price must be an integer greater than 0.`,
    })
  } else {
    return next()
  }
}

// middleware to check if the dish has an image
// needed for "create()" and "update()".
function bodyHasImg(req, res, next) {
  // deconstruct image_url from request body
  const {  data: { image_url } = {} } = req.body
  // if image_url is truthy, move request to next function
  if (image_url) {
    // setting response locals
    res.locals.image_url = image_url
    return next()
  } else {
    next({
      status: 400,
      message: `An 'image_url' property is required.`,
    })
  }
}

// middleware to check if the dish using dish id
// needed for "read()" and "update()".
function dishExists(req, res, next) {
  // deconstruct dishId from request parameters
  const { dishId } = req.params
  // create a variable for the dish that matches the dish id
  const matchingDish = dishes.find(dish => dish.id === dishId)
  // if matchingDish is truthy, move to the next function
  if (matchingDish) {
    // setting response locals
    res.locals.matchingDish = matchingDish
    return next()
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  })
}

// middleware to check if the data id matches it's parameters id
// needed for "update()".
function dishIdMatchDataId(req, res, next) {
  const { data: { id } = {} } = req.body
  const { dishId } = req.params
  // if the id is defined, not null, not a string, and not the dishId
  if (id !== "" && id !== dishId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `id ${id} must match dataId provided in parameters`,
    })
  }
  return next()
}

// http functions

// to list all dishes
function list(req, res) {
  res.json({ data: dishes })
}

// to read a specific dishId
function read(req, res) {
  const { dishId } = req.params
  // create an variable that finds the dish with a matching id
  const matchingDish = dishes.find(dish =>  dish.id === dishId)
  // return that dish data
  res.json({ data: res.locals.matchingDish })
}

// to post a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body
  // dish object for making an update request
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  }
  // push the new dish into array with other dishes
  dishes.push(newDish)
  // send an success status and the new dish object.
  res.status(201).json({ data: newDish })
}

function update(req, res) {
  const dishId = req.params.dishId
  // create an variable that finds the dish with a matching id
  const matchingDish = dishes.find(dish =>  dish.id === dishId)
  const { data: { name, description, price, image_url } = {} } = req.body
  // using the variable to define the key-value pairs of the new dish
  matchingDish.description = description
  matchingDish.name = name
  matchingDish.price = price
  matchingDish.image_url = image_url
  // return the new dish's data
  res.json({ data: matchingDish })
}

module.exports = {
  list,
  read: [ dishExists, read ],
  create: [
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasValidPrice,
    bodyHasImg,
    create,
  ],
  update: [
    dishExists,
    dishIdMatchDataId,
    bodyHasName,
    bodyHasDescription,
    bodyHasImg,
    bodyHasPrice,
    bodyHasValidPrice,
    bodyHasValidPriceUpdate,
    update,
  ],
}
