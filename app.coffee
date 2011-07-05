express = require 'express'
expose = require 'express-expose'
app = module.exports = express.createServer()

fs = require 'fs'
_ = require('underscore')._

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.compiler
    src: __dirname + '/source'
    dest: __dirname + '/public'
    enable: ['coffeescript']
  app.use express.static(__dirname + '/public')

app.get '/', (req, res) ->
  res.render 'index'

