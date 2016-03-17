var fs = require('fs');
var path = require('path');
var colors = require('colors');

var server = {};

server.create = function (apis, filename, rootpath) {
  var filepath = path.join(rootpath, 'routes');
  createPath(filepath);
  flushRoutes(apis, filepath, filename);
};
server.createPath = createPath;

module.exports = server;



///////////////
/// defined ///
///////////////

function flushRoutes(apis, filepath, filename) {
  var data = '';
  // header
  data += getHeader();
  // routes
  data += getRoutes(apis);
  // footer
  data += getFooter();
  // flush data to file
  flushData(path.join(filepath, filename), data);
}

// get routes
function getRoutes(apis) {
  var data = '';
  for (var i = 0; i < apis.length; i++) {
    data += getApiRoutes(apis[i]);
  }
  return data;
}

// get api route
function getApiRoutes(api) {
  var data = '';
  // comment 
  data += '\n\n';
  data += '//////////////////////////////\n';
  data += '// ' + trim(api.displayName) + '\n';
  data += '//////////////////////////////\n';

  var methods = api.methods;
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i];
    data += getMethodApiRoutes(method, api.realUri, api.realUriParameter);
  }
  return data;
}

// get api method route
function getMethodApiRoutes(method, url, uriParameters) {
  var data = '';

  // comment
  data += '/**\n';
  data += ' * ' + trim(method.description) + '\n';
  data += ' */\n';

  var realUrl = parseUri2Url(url, uriParameters);
  // head
  data += 'router.' + method.method + "('" + realUrl + "', function (req, res) {\n";
  // log
  // url
  data += "  console.log('url:'.green + '" + realUrl + "');\n";
  // param
  data += "  console.log('parameters:'.grey + JSON.stringify(req.parameters || {}));\n";
  // return
  data += getMethodApiRoutesResponse(method.responses);
  // foot
  data += '});\n';
  return data;
}

// get api method route response
function getMethodApiRoutesResponse(responses) {
  var data = '';
  if (!responses) {
    return data;
  }

  var examples = getResponseExamples(responses);
  if (examples.length > 0) {
    var def = examples[0];

    data += '  var expectResCode = req.query.expectResCode;\n';
    data += '  if (!expectResCode) {\n';
    data += '    expectResCode = \'' + def.statusCode + '\';\n';
    data += '  }\n';
    data += '  expectResCode = parseInt(expectResCode);\n'
      // switch
    data += '  switch (expectResCode) {\n';

    for (var i = 0; i < examples.length; i++) {
      var example = examples[i];
      // console.log('statusCode:%s', example.statusCode);
      // console.log('description:%s', example.description);
      // console.log('example:%s', example.example);

      data += '  case ' + example.statusCode + ':\n';
      data += "    res.send('" + example.example + "');\n";
      data += '    break;\n';
    }

    // default
    data += '  default:\n';
    data += "    res.send('" + def.example + "');\n";

    data += '  }\n';
  }

  data += '  res.end();\n';

  return data;
}

// get response example
function getResponseExamples(responses) {
  // statusCode - body
  var examples = [];
  for (var statusCode in responses) {
    var example = {
      // statusCode
      // example
    };
    example.statusCode = statusCode;
    var tmp = responses[statusCode];
    example.description = tmp.description || '';
    tmp = tmp.body;
    if (!tmp || tmp.size === 0) {
      console.warn('status '.red + statusCode + ' does not have body.');
      continue;
    }
    var application = tmp['application/json'] || tmp['application/xml'] || tmp['application/x-www-form-urlencoded'] || tmp['multipart/form-data'];
    if (!application || !application.example) {
      continue;
    }
    example.example = trim(application.example);

    examples.push(example);

  }
  return examples;
}

// parse uri to url
function parseUri2Url(url, uriParameters) {
  var routeUrl = url;
  for (var key in uriParameters) {
    routeUrl = routeUrl.replace('{' + key + '}', ':' + key);
  }
  return routeUrl;
}

// flush data
function flushData(file, data) {
  return fs.writeFileSync(file, data);
}

// get header
function getHeader() {
  var data = '';
  // require
  data += "var express = require('express');\n";
  data += "var colors = require('colors');\n";
  data += "var router = express.Router();\n";
  data += '\n';
  return data;
}

// get footer
function getFooter() {
  return 'module.exports = router;';
}

// trim
function trim(data) {
  if (!data) {
    return '';
  }
  return data.replace(/[\r]/g, "").replace(/[\t]/g, " ").replace(/[\n]/g, " ").replace(/[']/g, "\\'");
}

// create route path
function createPath(filepath) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
    console.log('create path '.cyan + filepath);
  }
}