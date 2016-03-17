var parser = require('./parser');
var server = require('./server');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var creator = {

};

/**
 * create
 * @param  raml     raml file
 * @param  filepath out file path
 */
creator.create = function (raml, tplpath, filepath) {
  if (!filepath) {
    filepath = './output';
  }
  // parse raml
  parser.parse(raml, function (ramlApis) {
    // crate filepath
    server.createPath(filepath);
    // routes
    createRoutes(ramlApis, filepath);
    // srver app.js
    createServerApp(ramlApis, filepath, tplpath);
  });
}

module.exports = creator;

///////////////
/// defined ///
///////////////

// create routes
function createRoutes(ramlApis, filepath) {
  for (var i = 0; i < ramlApis.length; i++) {
    var ramlApi = ramlApis[i];
    var uri = ramlApi.uri;
    var api = ramlApi.api;

    var filename = getFilename(uri);
    console.log(filename);
    server.create(api, filename + '.js', filepath);
  }
}

// create server app.js
function createServerApp(ramlApis, filepath, tplpath) {

  if (!tplpath) {
    tplpath = './node_modules/raml-parser-nodejs/';
  }

  var routeStr = '';
  var useRouteStr = '';

  for (var i = 0; i < ramlApis.length; i++) {
    var uri = ramlApis[i].uri;
    var filename = getFilename(uri);
    var routename = getRouteName(filename);

    // var routes = require('./routes/index');
    routeStr += "var " + routename + " = require('./routes/" + filename + "');\n";
    // app.use('/', routes);
    useRouteStr += "app.use('" + uri + "', " + routename + ");\n";

  }

  fs.readFile(path.join(tplpath, 'tpl/app.js'), 'utf-8', function (err, datas) {
    var content = datas.replace('// require routes', routeStr).replace('// set routes', useRouteStr);
    fs.writeFile(path.join(filepath, 'app.js'), content);
  });

  fs.readFile(path.join(tplpath, 'tpl/package.json'), 'utf-8', function (err, datas) {
    fs.writeFile(path.join(filepath, 'package.json'), datas);
  });

}

// ger filename
function getFilename(uri) {
  return uri.substring(1).replace(/[{|}]/g, "").replace(/[/]/g, ".");
}

// get routename
function getRouteName(filename) {
  return filename.replace(/[.]/g, "");
}