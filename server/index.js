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

var joins = (table) => `
  LEFT JOIN sex ON ${table}.sex IS NOT NULL AND ${table}.sex = sex.id
  LEFT JOIN locations ON ${table}.place IS NOT NULL AND ${table}.place = locations.id
  LEFT JOIN lengths ON ${table}.length IS NOT NULL AND ${table}.length = lengths.id
  LEFT JOIN coats ON ${table}.coat IS NOT NULL AND ${table}.coat = coats.id
  LEFT JOIN sizes ON ${table}.size IS NOT NULL AND ${table}.size = sizes.id
  LEFT JOIN types ON ${table}.type IS NOT NULL AND ${table}.type = types.id
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
      console.dir(err)
      onerror([500], res)
    } else {
      console.log(data)
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
  connection.query(`SELECT * FROM animals ${joins('animals')} WHERE animals.slug = '${slug}'`, done)

  function done(err, data) {
    if (err) {
      console.error(err)
      if (err.code == 'ER_PARSE_ERROR') {
        onerror([400], res)
      }
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
    SELECT * FROM sex as sex;
    SELECT * FROM locations as locations;
    SELECT * FROM lengths as lengths;
    SELECT * FROM sizes as sizes;
    SELECT * FROM coats as coats;
  `, done)

  function done(err, data) {
    if (err) {
      console.error(err)
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
  connection.query('INSERT INTO animals SET ?', newAnimal, done)

  function done(err, entry) {
    if (err) {
      onerror([422], res)
    } else if (req.file) {
      connection.query(`SELECT * from animals ORDER BY animals.id DESC LIMIT 1`, fetched)

      function fetched(err, entry) {
        if (err) {
          console.error(err)
        } else {
          fs.rename(req.file.path, `db/image/${entry[0].name}_${entry[0].type}${entry[0].place}.jpg`)
          connection.query('INSERT INTO images SET ?', {
            file: `${entry[0].name}_${entry[0].type}${entry[0].place}.jpg`,
            mime: req.file.mimetype
          }, done)

          function done(err, data) {
            if (err) {
              fs.unlink(`${entry[0].name}_${entry[0].type}${entry[0].place}.jpg`, function (err) {
                if (err) {
                  onerror([500], res)
                } else {
                  onerror([422], res)
                }
              })
            } else {
              console.log(entry[0])
              connection.query(`UPDATE animals SET image = LAST_INSERT_ID() WHERE animals.id = ${entry[0].id}`, function(err) {
                if (err) {
                  console.error(err)
                } else {
                  res.redirect(`/${entry[0].id}`)
                }
              })
            }
          }
        }
      }
    } else {
      connection.query('SELECT LAST_INSERT_ID()', fetched)
      function fetched(err, entry) {
        res.redirect(`/${entry[0]['LAST_INSERT_ID()']}`)
      }
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
  var slug = req.params.slug
  connection.query(`SELECT * FROM animals ${joins('animals')} WHERE animals.slug = '${slug}'`, function(err, result) {
    console.log(result)
    if (err) {
      console.error(err)
    } else if (result[0].file) {
      fs.unlink('db/image/' + result[0].file)
      connection.query(`
        DELETE FROM images where images.id = ${result[0].id};
        DELETE FROM animals where animals.slug = ${slug};
      `, function(err) {
        if (err) {
          console.error(err)
          onerror([500], res)
        }
      })
    } else {
      connection.query(`DELETE FROM animals where animals.slug = ${slug}`)
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
    json: () => res.json(errObj),
    html: () => res.render('error.ejs', Object.assign({}, errObj, helpers))
  })
}
