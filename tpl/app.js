var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var colors = require('colors');
var _ = require('underscore');

// require routes

var app = express();

// view engine setup
app.set('port', process.env.PORT || 3000);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置跨域访问
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1')
  res.header("Content-Type", "application/json;charset=utf-8");
  var query = req.query || {};
  var body = req.body || {};
  var params = req.params || {};
  var parameters = _.extend(query, body);
  parameters = _.extend(parameters, params);
  req.parameters = parameters;
  next();
});

// set routes

// server
var server = app.listen(app.get('port'), function () {
  var message = 'server started in ' + app.get('port')
  console.log(message.green);
})