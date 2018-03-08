'use strict'

var express = require('express')
var db = require('../db')
var helpers = require('./helpers')
var HTTPStatus = require('http-status')
var bodyParser = require('body-parser')

module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  .use('/image', express.static('db/image'))
  .use(bodyParser.urlencoded({ extended: true }))
  .get('/', all)
  /* TODO: Other HTTP methods. */
  .post('/', add)
  .get('/add', addForm)
  .get('/:id', get)
  // .put('/:id', set)
  // .patch('/:id', change)
  .delete('/:id', remove)
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
    var isInvalidRequest = isInvalidId(id)

    if (!isInvalidRequest) {
        var result = {data: db.get(id)}
        res.format({
            json: () => res.json(result.data),
            html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
        })
    } else error(isInvalidRequest, res)
}

function addForm(req, res) {
  res.render('add.ejs')
}

function add (req, res) {
  var newAnimal = {
    name: req.body.name,
    type: req.body.type,
    description: req.body.description,
    place: req.body.place,
    intake: req.body.intake,
    sex: req.body.sex,
    age: parseInt(req.body.age, 10),
    weight: parseInt(req.body.weight || '0', 10),
    size: req.body.size,
    length: req.body.length,
    coat: req.body.coat,
    vaccinated: req.body.vaccinated == '1' ? true : false,
    declawed: req.body.declawed != undefined ? req.body.declawed == '1' ? true : false : undefined,
    primaryColor: req.body.primaryColor,
    secondaryColor: req.body.secondaryColor == '' ? undefined : req.body.secondaryColor

  var addedAnimal = db.add(newAnimal)
  res.redirect('/' + addedAnimal.id)
}

function remove(req, res) {
    var id = req.params.id
    var isInvalidRequest = isInvalidId(id)

    if (!isInvalidRequest) {
        db.remove(id)
        res.status(204).end()
    } else error(isInvalidRequest, res)
}

function isInvalidId(id) {
    var invalidIdentifiers = new RegExp(/[^\d]/)

    if (invalidIdentifiers.test(id)) return 400
    else if (db.removed(id)) return 410
    else if (!db.has(id)) return 404
    else return false
}

function error(errCode,  res) {
    // TODO: Add recursive error code adding if multiple error codes are given
    var errObj = {
        errors: [{ id: errCode, title: HTTPStatus[errCode] }]
    }
    res.format({
        json: () => res.status(errCode).json(errObj.errors),
        html: () => res.render('error.ejs', Object.assign({}, errObj, helpers))
    })
}
