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
  data += "  console.log('parameters:'.grey + JSON.stringify(req.parameters));\n";
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
  // there is not response
  if (examples.datas.length === 0) {
    data += '  res.end();\n';
    return data;
  }

  // expectResCode
  data += '  var expectResCode = req.parameters.expectResCode;\n';
  data += '  if (!expectResCode) {\n';
  data += "    expectResCode = '" + examples.defaultStatusCode + "';\n";
  data += '  }\n';
  data += '  expectResCode = parseInt(expectResCode);\n';

  // some example
  for (var i = 0; i < examples.datas.length; i++) {
    var example = examples.datas[i];
    data += getMethodApiRoutesResponseExample(example);
  }

  data += '\n';
  data += '  res.end();\n';

  return data;
}

// get api method route response example
function getMethodApiRoutesResponseExample(example) {
  var data = '';

  data += '\n';
  data += "  if (expectResCode === " + example.statusCode + ") {\n";
  data += "    console.log('description " + example.description + "'.green);\n";
  var contentTypes = example.contentTypes;
  if (contentTypes.length > 0) {
    // expectResType
    data += '    var expectResType = req.parameters.expectResType;\n';
    data += '    if (!expectResType) {\n';
    data += '      expectResType = \'' + example.defaultContentType + '\';\n';
    data += '    }\n';

    // contentType
    for (var i = 0; i < contentTypes.length; i++) {
      var ct = contentTypes[i];
      data += "    if (expectResType === '" + ct.contentType + "') {\n";
      // contentType
      data += "      res.setHeader('Content-Type', '" + ct.contentType + "');\n";
      var example = ct.example;
      if (!example || example.length === 0) {
        data += "      res.end();\n";
        continue;
      }
      data += "      var msg = '';\n";
      for (var j = 0; j < example.length; j++) {
        data += "      msg += '" + example[j] + "\\n';\n";
      }
      data += "      res.send(msg);\n";
      // --
      data += '    }\n';
    }

  }

  data += "  }\n";

  return data;
}

// get response example
function getResponseExamples(responses) {
  // statusCode - body
  var examples = {
    // defaultStatusCode
    datas: []
  };
  for (var statusCode in responses) {
    // set default
    if (!examples.defaultStatusCode) {
      examples.defaultStatusCode = statusCode;
    }

    var example = {
      // statusCode
      // description
      // contentTypes
    };
    example.statusCode = statusCode;
    var tmp = responses[statusCode];
    example.description = tmp.description || '';
    tmp = tmp.body;
    if (!tmp || tmp.size === 0) {
      console.log('status '.red + statusCode + ' does not have body.');
      continue;
    }
    var contentTypes = [];
    for (var contentType in tmp) {
      // set default
      if (!example.defaultContentType) {
        example.defaultContentType = contentType;
      }
      var ct = {
        // contentType
        // example
        // schema
      };

      ct.contentType = contentType;
      ct.example = getExample(tmp[contentType].example);
      ct.schema = getSchema(tmp[contentType].schema);

      contentTypes.push(ct);
    }
    example.contentTypes = contentTypes;

    examples.datas.push(example);

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

// get example
function getExample(example) {
  var data = [];
  if (!example) {
    return data;
  }
  var array = example.replace(/[']/g, "\\'").split('\n');
  for (var i = 0; i < array.length; i++) {
    data.push(array[i]);
  }
  return data;
}

function getSchema(schema) {
  return getExample(schema);
}

// trim
function trim(data) {
  if (!data) {
    return '';
  }
  return data.replace(/[\r]/g, "").replace(/[\t]/g, " ").replace(/[\n]/g, "\\\\n").replace(/[']/g, "\\'");
}

// create route path
function createPath(filepath) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
    console.log('create path '.cyan + filepath);
  }
}