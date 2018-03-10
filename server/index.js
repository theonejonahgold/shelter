'use strict'

var fs = require('fs')
var express = require('express')
var db = require('../db')
var helpers = require('./helpers')
var HTTPStatus = require('http-status')
var bodyParser = require('body-parser')
var multer = require('multer')

var upload = multer({
  dest: 'db/image',
  fileFilter: function (req, file, cb) {
    if (file.mimetype != 'image/jpeg') {
      cb(null, false)
    } else {
      cb(null, true)
    }
  }
})

module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(bodyParser.urlencoded({
    extended: true
  }))
  .use(bodyParser.json())
  .use(express.static('static'))
  .use('/image', express.static('db/image'))
  .get('/', all)
  .post('/', upload.single('image'), add)
  .get('/add', addForm)
  .get('/:id', get)
  /* TODO: Other HTTP methods. */
  .put('/:id', set)
  .patch('/:id', change)
  .delete('/:id', remove)
  .listen(1902)

function all(req, res) {
  var result = {
    errors: [],
    data: db.all()
  }
  /* Support both a request for JSON and a request for HTML  */
  res.format({
    json: () => res.json(result),
    html: () => res.render('list.ejs', Object.assign({}, result, helpers))
  })
}

function get(req, res) {
  var id = req.params.id
  var has

  try {
    has = db.has(id)
  } catch (err) {
    onerror(400, res)
  }

  if (has) {
    var result = {
      data: db.get(id)
    }
    res.format({
      json: () => res.json(result.data),
      html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
    })
  } else if (db.removed(id)) {
    onerror(410, res)
  } else {
    onerror(404, res)
  }
}

function addForm(req, res) {
  res.render('add.ejs')
}

function add(req, res) {
  var newAnimal
  if (req.headers['content-type'].split(';')[0] == 'multipart/form-data') {
    newAnimal = {
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
      vaccinated: req.body.vaccinated == '1',
      declawed: req.body.declawed != undefined ?
        req.body.declawed == '1' :
        undefined,
      primaryColor: req.body.primaryColor,
      secondaryColor: req.body.secondaryColor == '' ?
        undefined :
        req.body.secondaryColor
    }
  } else {
    newAnimal = req.body
  }
  try {
    var addedAnimal = db.add(newAnimal)
    if (req.file) {
      fs.rename(req.file.path, `db/image/${addedAnimal.id}.jpg`)
    }
    res.redirect('/' + addedAnimal.id)
  } catch (err) {
    if (req.file) {
      fs.unlink(req.file.path, function (err) {
        if (err) {
          onerror(500, res)
        } else {
          onerror(422, res)
        }
      })
    } else {
      onerror(422, res)
    }
  }
}

function set(req, res) {
  var paramId = req.params.id
  var bodyId = req.body.id

  if (paramId == bodyId) {
    var resStatus
    try {
      if (db.has(bodyId)) {
        resStatus = 200
      } else {
        resStatus = 201
      }
      var setAnimal = db.set(req.body)
      res.status(resStatus).send()
    } catch (err) {
      console.error(err)
      onerror(422, res)
    }
  } else {
    onerror(400, res)
  }
}

function remove(req, res) {
  var id = req.params.id
  try {
    db.remove(id)
    fs.unlink(`db/image/${id}.jpg`, function (err) {
      if (err) {
        console.log(err)
      }
    })
  } catch (err) {
    if (db.removed(id)) {
      onerror(410, res)
    } else {
      onerror(404, res)
    }
    return
  }
  res.status(204).end()
}

function onerror(errCode, res) {
  // TODO: Add recursive error code adding if multiple error codes are given
  var errObj = {
    errors: [{
      id: errCode,
      title: HTTPStatus[errCode]
    }]
  }
  res.format({
    json: () => res.status(errCode).json(errObj.errors),
    html: () => res.render('error.ejs', Object.assign({}, errObj, helpers))
  })
}
