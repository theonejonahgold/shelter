'use strict'

var express = require('express')
var db = require('../db')
var helpers = require('./helpers')

module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  .use('/image', express.static('db/image'))
  .get('/', all)
  /* TODO: Other HTTP methods. */
  // .post('/', add)
  .get('/:id', get)
  // .put('/:id', set)
  // .patch('/:id', change)
  // .delete('/:id', remove)
  .listen(1902)

function all(req, res) {
  var result = {errors: [], data: db.all()}

  /* Use the following to support just HTML:  */
  res.render('list.ejs', Object.assign({}, result, helpers))

  /* Support both a request for JSON and a request for HTML  */
  // res.format({
  //   json: () => res.json(result),
  //   html: () => res.render('list.ejs', Object.assign({}, result, helpers))
  // })
}

function get(req, res) {
  var id = req.params.id
  var result

  if (id === '-') {
    result = {errors: [{id: 400, title: 'Bad request'}], data: {}}
    res.render('error.ejs', Object.assign({}, result, helpers))
  } else if (!db.has(id)) {
    result = {errors: [{id: 404, title: 'Page not found'}], data: {}}
    res.render('error.ejs', Object.assign({}, result, helpers))
  } else {
    result = {errors: [], data: db.get(id)}
    res.render('detail.ejs', Object.assign({}, result, helpers))
  }
}
