'use strict'

var fs = require('fs')
var express = require('express')
var multer = require('multer')
var HTTPStatus = require('http-status')
var contentType = require('content-type')
var bodyParser = require('body-parser')
var moment = require('moment')
var mysql = require('mysql')
var db = require('../db')
var helpers = require('./helpers')
require('dotenv').config()

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
})

connection.connect()

var upload = multer({
  dest: 'db/image',
  fileFilter: function (req, file, cb) {
    cb(null, file.mimetype === 'image/jpeg')
  }
})

var joins = table => `
  LEFT JOIN sex ON ${table}.sex = sex.id
  LEFT JOIN locations ON ${table}.place = locations.id
  LEFT JOIN types ON ${table}.type = types.id
  LEFT JOIN lengths ON ${table}.length IS NOT NULL AND ${table}.length = lengths.id
  LEFT JOIN coats ON ${table}.coat IS NOT NULL AND ${table}.coat = coats.id
  LEFT JOIN sizes ON ${table}.size IS NOT NULL AND ${table}.size = sizes.id
  LEFT JOIN images ON ${table}.image IS NOT NULL AND ${table}.image = images.id
`

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
  .get('/:slug', get)
  .put('/:id', set)
  .patch('/:id', change)
  .delete('/:slug', remove)
  .listen(1902)

function all(req, res, next) {
  connection.query(`SELECT * FROM animals ${joins('animals')}`, done)

  function done(err, data) {
    if (err) {
      onerror([500], res)
    } else {
      var result = {
        data: data
      }
      res.format({
        json: () => res.json(result),
        html: () => res.render('list.ejs', Object.assign({}, result, helpers))
      })
    }
  }
}

function get(req, res, next) {
  var slug = req.params.slug
  connection.query(`SELECT * FROM animals ${joins('animals')} WHERE animals.slug = ?`, slug, done)

  function done(err, data) {
    if (err && err.code === 'ER_PARSE_ERROR') {
      onerror([400], res)
    } else if (!data.length) {
      onerror([404], res)
    } else {
      var result = {
        data: data[0]
      }
      res.format({
        json: () => res.json(result),
        html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
      })
    }
  }
}

function addForm(req, res) {
  connection.query(`
    SELECT * FROM sex;
    SELECT * FROM types;
    SELECT * FROM locations;
    SELECT * FROM lengths;
    SELECT * FROM sizes;
    SELECT * FROM coats;
  `, done)

  function done(err, data) {
    if (err) {
      onerror([500], res)
    } else {
      var result = {
        data: data
      }
      res.render('add.ejs', Object.assign({}, result, helpers))
    }
  }
}

function add(req, res, next) {
  var newAnimal = req.body
  newAnimal.slug = newAnimal.name.toLowerCase() + '_' + newAnimal.date
  if (contentType.parse(req).type === 'multipart/form-data') {
    newAnimal.intake = moment(newAnimal.intake, 'DD-MM-YYY').format('YYYY-MM-DD')
    newAnimal.weight = parseFloat(newAnimal.weight) || 0
  }
  connection.query('INSERT INTO animals SET ?', newAnimal, onadd)

  function onadd(err, entry) {
    if (err) {
      onerror([422], res)
    } else if (req.file) {
      connection.query(`SELECT name, type, place, slug from animals ORDER BY animals.id DESC LIMIT 1`, fetched)

      function fetched(err, entry) {
        var entry = entry[0]
        fs.rename(req.file.path, `db/image/${entry.name}_${entry.type}${entry.place}.jpg`)
        connection.query('INSERT INTO images SET ?', {
          file: `${entry.name}_${entry.type}${entry.place}.jpg`,
          mime: req.file.mimetype
        }, onimageinsert)

        function onimageinsert(err, data) {
          if (err) {
            fs.unlink(`${entry.name}_${entry.type}${entry.place}.jpg`, function (err) {
              if (err) {
                onerror([500], res)
              } else {
                onerror([422], res)
              }
            })
          } else {
            connection.query('UPDATE animals SET image = LAST_INSERT_ID() WHERE animals.id = ?', entry.id, function (err) {
              if (err) {
                console.error(err)
              } else {
                res.redirect(`/${entry.slug}`)
              }
            })
          }
        }
      }
    } else {
      connection.query('SELECT LAST_INSERT_ID()', fetched)

      function fetched(err, entry) {
        res.redirect(`/${entry.slug}`)
      }
    }
  }
}

function set(req, res) {
  var paramId = req.params.id
  var bodyId = req.body.id
  if (paramId === bodyId) {
    connection.query('SELECT * FROM animals WHERE animals.id = ', bodyId, onfetch)

    function onfetch (err, data) {
      var resStatus
      if (err) {
        onerror([500], res)
      } else if (!data.length) {
        resStatus = 201
      } else {
        resStatus = 200
      }
      connection.query('INSERT INTO animals SET ? ON DUPLICATE KEY UPDATE ?', req.body, done)

      function done(err) {
        if (err) {
          onerror([500], res)
        } else {
          res.status(resStatus).json()
        }
      }
    }
  } else {
    onerror([400], res)
  }
}

function change(req, res) {
  var id = req.params.id
  connection.query('SELECT * FROM animals WHERE animals.id = ', bodyId, onfetch)

  function onfetch(err, data) {
    if (err) {
      onerror([500], res)
    } else if (!data[0].length) {
      onerror([404], res)
    } else {
      Object.assign(data[0], req.body)
      connection.query('UPDATE animals SET ? WHERE ID = ?', [req.body, id], done)

      function done(err) {
        if (err) {
          onerror([500], res)
        } else {
          res.status(200).json()
        }
      }
    }
  }
}

function remove(req, res) {
  var slug = req.params.slug
  connection.query(`SELECT * FROM animals ${joins('animals')} WHERE animals.slug = ?`, slug, function (err, result) {
    if (err) {
      onerror([500], res)
    } else if (!result.length) {
      onerror([404], res)
    } else if (result[0].file) {
      fs.unlink('db/image/' + result[0].file, function (err) {
        if (err) {
          onerror([500], res)
        } else {
          connection.query('DELETE FROM animals where animals.id = ?', result[0].id, function (err) {
            if (err) {
              onerror([500], res)
            } else {
              res.status(204).json()
            }
          })
        }
      })
    } else {
      connection.query(`DELETE FROM animals where animals.slug = ?`, slug, function (err) {
        if (err) {
          onerror([500], res)
        } else {
          res.status(204).json()
        }
      })
    }
  })
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
    json: () => res.status(errObj.errors[0].id).json(errObj),
    html: () => res.status(errObj.errors[0].id).render('error.ejs', Object.assign({}, errObj, helpers))
  })
}
