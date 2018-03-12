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
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'image/jpeg')
})

const onerror = async (errCodes, res) => {
  const errObj = {
    errors: await errCodes.map(err => ({
      id: err,
      title: HTTPStatus[err],
      detail: 'All is well, cat is going to sleep now..'
    }))
  }
  await res.format({
    json: () => res.json(errObj),
    html: () => res.render('error.ejs', Object.assign({}, errObj, helpers))
  })
}

const all = async (req, res) => {
  const result = {
    data: await db.all()
  }
  res.format({
    json: () => res.json(result),
    html: () => res.render('list.ejs', Object.assign({}, result, helpers))
  })
}

const get = async (req, res) => {
  const id = req.params.id
  let has
  try {
    has = await db.has(id)
  } catch (err) {
    onerror([400], res)
    return
  }
  has ? (async () => {
    const result = {
      data: await db.get(id)
    }
    await res.format({
      json: () => res.json(result),
      html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
    })
  })() :
  await db.removed(id) ?
    onerror([410], res) :
    onerror([404], res)
}

const addForm = async (req, res) => {
  await res.render('add.ejs')
}

const add = async (req, res) => {
  let newAnimal = await req.body
  if (contentType.parse(req).type === 'multipart/form-data') {
    newAnimal.age = parseInt(newAnimal.age, 10)
    newAnimal.weight = parseInt(newAnimal.weight || '0', 10)
    newAnimal.vaccinated = Boolean(newAnimal.vaccinated)
    newAnimal.declawed = Boolean(newAnimal.declawed)
    newAnimal.secondaryColor = newAnimal.secondaryColor || undefined
  }
  try {
    const addedAnimal = await db.add(newAnimal)
    req.file ? await fs.rename(req.file.path, `db/image/${addedAnimal.id}.jpg`) : null
    await res.redirect('/' + addedAnimal.id)
  } catch (err) {
    req.file ? (async () => {
      const err = await fs.unlink(req.file.path)
      err ? onerror([500], res) : onerror([422], res)
    }) : onerror([422], res)
  }
}

const set = async (req, res) => {
  const paramId = req.params.id
  const bodyId = req.body.id
  paramId === bodyId ?
    (async () => {
      let resStatus
      try {
        await db.has(bodyId) ?
          resStatus = 200 :
          resStatus = 201
        await db.set(req.body)
        await res.status(resStatus).json({
          data: await db.get(bodyId)
        })
      } catch (err) {
        onerror([422], res)
      }
    })() :
    onerror([400], res)
}

const change = async (req, res) => {
  const id = req.params.id
  try {
    db.has(id) ? (async () => {
      let dbEntry = await db.get(id)
      Object.assign(dbEntry, req.body)
      await db.set(dbEntry)
      await res.status(200).json({
        data: await db.get(id)
      })
    })() :
    await db.removed(id) ?
      onerror([410], res) :
      onerror([404], res)
  } catch (err) {
    onerror([422], res)
  }
}

const remove = async (req, res) => {
  const id = req.params.id
  try {
    await db.remove(id)
    const err = await fs.unlink(`db/image/${id}.jpg`)
    err && onerror([500], res)
    await res.status(204).end()
  } catch (err) {
    await db.removed(id) ?
      onerror([410], res) :
      onerror([404], res)
  }
}

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
