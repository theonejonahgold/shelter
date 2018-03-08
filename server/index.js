'use strict'

var express = require('express')
var db = require('../db')
var helpers = require('./helpers')
var HTTPStatus = require('http-status')

var invalidIdentifiers = new RegExp(/[^\d]/)

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

    /* Support both a request for JSON and a request for HTML  */
    res.format({
        json: () => res.json(result),
        html: () => res.render('list.ejs', Object.assign({}, result, helpers))
    })
}

function get(req, res) {
    var id = req.params.id

    if (invalidIdentifiers.test(id)) error(400, res)
    else if (!db.has(id)) error(404, res)
    else {
        var result = {data: db.get(id)}
        res.format({
            json: () => res.json(result.data),
            html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
        })
    }
}

function error(errCode,  res) {
    // TODO: Add recursive error code adding if multiple error codes are given
    var errObj = {
        errors: [{ id: errCode, title: HTTPStatus[errCode] }]
    }
    res.format({
        json: () => res.json(errObj.errors),
        html: () => res.render('error.ejs', Object.assign({}, errObj, helpers))
    })
}
