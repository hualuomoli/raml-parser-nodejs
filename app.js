var parser = require('./parser');
var server = require('./server');
var path = require('path');
var fs = require('fs');

var filepath = path.join(path.join(process.cwd()), 'tmp');

parser.parse('raml/api.raml', function (ramlApis) {

  server.createPath(filepath);

  // routes
  createRoutes(ramlApis);
  // srver app.js
  createServerApp(ramlApis);
});


//////////
function createRoutes(ramlApis) {
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
function createServerApp(ramlApis) {
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

  fs.readFile('tpl/app.js', 'utf-8', function (err, datas) {
    var content = datas.replace('// require routes', routeStr).replace('// set routes', useRouteStr);
    fs.writeFile(path.join(filepath, 'app.js'), content);
  });

  fs.readFile('tpl/package.json', 'utf-8', function (err, datas) {
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