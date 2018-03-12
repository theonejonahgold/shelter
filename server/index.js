'use strict'

var fs = require('fs')
var express = require('express')
var multer = require('multer')
var HTTPStatus = require('http-status')
var contentType = require('content-type')
var bodyParser = require('body-parser')
var db = require('../db')
var helpers = require('./helpers')

var upload = multer({
  dest: 'db/image',
  fileFilter: function (req, file, cb) {
    cb(null, file.mimetype === 'image/jpeg')
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
  .put('/:id', set)
  .patch('/:id', change)
  .delete('/:id', remove)
  .listen(1902)

function all(req, res) {
  var result = {
    errors: [],
    data: db.all()
  }
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
    onerror([400], res)
    return
  }
  if (has) {
    var result = {
      data: db.get(id)
    }
    res.format({
      json: () => res.json(result),
      html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
    })
  } else if (db.removed(id)) {
    onerror([410], res)
  } else {
    onerror([404], res)
  }
}

function addForm(req, res) {
  res.render('add.ejs')
}

function add(req, res) {
  var newAnimal = req.body
  if (contentType.parse(req).type === 'multipart/form-data') {
    newAnimal.declawed = newAnimal.declawed ?
      newAnimal.declawed === '1' :
      undefined
    newAnimal.secondaryColor = newAnimal.secondaryColor === '' ?
      undefined :
      newAnimal.secondaryColor
    newAnimal.vaccinated = newAnimal.vaccinated === '1'
    newAnimal.weight = parseInt(newAnimal.weight || '0', 10)
    newAnimal.age = parseInt(newAnimal.age, 10)
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
          onerror([500], res)
        } else {
          onerror([422], res)
        }
      })
    } else {
      onerror([422], res)
    }
  }
}

function set(req, res) {
  var paramId = req.params.id
  var bodyId = req.body.id
  if (paramId === bodyId) {
    var resStatus
    try {
      if (db.has(bodyId)) {
        resStatus = 200
      } else {
        resStatus = 201
      }
      db.set(req.body)
      res.status(resStatus).json({
        errors: [],
        data: db.get(bodyId)
      })
    } catch (err) {
      onerror([422], res)
    }
  } else {
    onerror([400], res)
  }
}

function change(req, res) {
  var id = req.params.id
  try {
    if (db.has(id)) {
      var dbEntry = db.get(id)
      Object.assign(dbEntry, req.body)
      db.set(dbEntry)
      res.status(200).json({
        errors: [],
        data: db.get(id)
      })
    } else if (db.removed(id)) {
      onerror([410], res)
    } else {
      onerror([404], res)
    }
  } catch (err) {
    onerror([422], res)
  }
}

function remove(req, res) {
  var id = req.params.id
  try {
    db.remove(id)
    fs.unlink(`db/image/${id}.jpg`, function (err) {
      if (err) {
        onerror([500], res)
      }
    })
    res.status(204).end()
  } catch (err) {
    if (db.removed(id)) {
      onerror([410], res)
    } else {
      onerror([404], res)
    }
  }
}

function onerror(errCodes, res) {
  var errObj = {
    errors: errCodes.map(err => {
      return {
        id: err,
        title: HTTPStatus[err],
        detail: 'All is well, cat is going to sleep now..'
      }
    })
  }
  res.format({
    json: () => res.json(errObj),
    html: () => res.render('error.ejs', Object.assign({}, errObj, helpers))
  })
}
