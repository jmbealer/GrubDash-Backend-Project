const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// middleware for checking if deliverTo exists
function bodyHasDeliver(req, res, next) {
  const { data: { deliverTo } = {} } = req.body
  if (deliverTo) {
    res.locals.deliverTo = deliverTo
    return next()
  }
  next({
    status: 400,
    message: `A 'deliverTo' property is required.`
  })
}

// middleware for checking if mobileNumber exists
function bodyHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body
  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber
    return next()
  }
  next({
    status: 400,
    message: `A 'mobileNumber' property is required.`,
  })
}

// middleware for checking if status exists
function bodyHasStatus(req, res, next) {
  const { data: { status } = {} } = req.body
  if (status) {
    res.locals.status = status
    return next()
  }
  next({
    status: 400,
    message: `A 'status' property is required.`,
  })
}

// middleware for checking if status is the correct format
function dataStringIsValid(req, res, next) {
  const { data: { status } = {} } = req.body
  // if status includes the following, move to next function
  if (
    status.includes("pending") ||
    status.includes("preparing") ||
    status.includes("out-for-delivery") ||
    status.includes("delivered")
  ) {
    res.locals.status = status
    return next()
  }
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'`,
  })
}

// middleware for checking if dishes exists
function bodyHasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body
  if (dishes) {
    res.locals.dishes = dishes
    return next()
  }
  next({
    status: 400,
    message: `A 'dishes' property is required.`,
  })
}

// middleware for checking if there valid number of dishes
function dishesArrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body
  // if there are no dishes, return error code and message
  if (!Array.isArray(res.locals.dishes)  || res.locals.dishes.length == 0) {
    return next({
      status: 400,
      message: `invalid dishes property: dishes property must be non-empty array`,
    })
  }
  next()
}


// middleware for checking if dish quantity is valid
function dishesArrayLengthIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body
  // loop over each dish
  dishes.forEach(dish => {
    const quantity = dish.quantity
    // if quatity is falsey, return error code and message
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      next({
        status: 400,
        message: `dish ${dish.id} must have quantity property, quantity must be an integer, and it must be equal to or less than 0`,
      })
    }
  })
  next()
}

// middleware for checking if order and data match
function dataIdMatchOrderId(req, res, next) {
  const { data: { id } = {} } = req.body
  const { orderId } = req.params
  if (id !== undefined && id !== null && id !== "" && id !== orderId) {
    next({
      status: 400,
      message: `id ${id} must match orderId provided in parameters`,
    })
  }
  return next()
}

// middleware for checking if the order exists
function orderExists(req, res, next) {
  const { orderId } = req.params
  const matchingOrder = orders.find(order => order.id === orderId)
  if (matchingOrder) {
    res.locals.order = matchingOrder
    return next()
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  })
}

// Route Handlers

function list(req, res) {
  res.json({ data: orders })
}

function update(req, res) {
  const { orderId } = req.params
  const matchingOrder = orders.find(order => order.id === orderId)
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
  matchingOrder.deliverTo = deliverTo
  matchingOrder.mobileNumber = mobileNumber
  matchingOrder.status = status
  matchingOrder.dishes = dishes
  res.json({ data: matchingOrder })
}

function read(req, res) {
  const { orderId } = req.params
  const matchingOrder = orders.find(order => order.id === orderId)
  res.json({ data: matchingOrder })
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "out-for-delivery",
    dishes,
  }
  orders.push(newOrder)
  res.status(201).json({ data: newOrder })
}

function destroy(req, res, next) {
  const { orderId } = req.params
  const matchingOrder = orders.find(order => order.id === orderId)
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body
  if (matchingOrder.status === "pending") {
    const index = orders.findIndex(order => order.id === Number(orderId))
    orders.splice(index, 1)
    res.sendStatus(204)
  }
  return next({
    status: 400,
    message: `order cannot be deleted unless order status = "pending"`
  })
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyHasDeliver,
    bodyHasMobileNumber,
    bodyHasDishes,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    create,
  ],
  update: [
    orderExists,
    dataIdMatchOrderId,
    bodyHasDeliver,
    bodyHasMobileNumber,
    bodyHasDishes,
    bodyHasStatus,
    dataStringIsValid,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    update,
  ],
  delete: [orderExists, destroy],
}
