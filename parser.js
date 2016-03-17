var ramlParser = require('raml-parser');
var fs = require('fs');
var path = require('path');
var colors = require('colors');

// exports 
var parser = {};

parser.parse = function (filename, callback) {
  console.log('loading.....'.green);

  ramlParser.loadFile(filename).then(function (ramlData) {
    // console.log(ramlData);
    // var apis = [];
    // getValidResource('', {}, ramlData.resources, apis);
    // callback(apis);

    var ramlApis = [];
    var resources = ramlData.resources;
    for (var i = 0; i < resources.length; i++) {
      var apis = [];
      var resource = resources[i];
      var relativeUri = resource.relativeUri;
      getValidResource('', resource.uriParameters || {}, resource.resources, apis);

      var ramlApi = {};
      ramlApi.uri = relativeUri;
      ramlApi.api = apis;

      ramlApis.push(ramlApi);
    }
    callback(ramlApis);
  }, function (error) {
    console.log('Error parsing: ' + error);
  });

};

module.exports = parser;



///////////////
/// defined ///
///////////////

/**
 * get valid resource
 * @param parentUrl           parent's url
 * @param parentUriParameters parent's uri parameters
 * @param resources           need parse resource
 * @param apis                store api object
 */
function getValidResource(parentUrl, parentUriParameters, resources, apis) {
  for (var i = 0; i < resources.length; i++) {
    var resource = resources[i];
    // real url
    var realUri = parentUrl + resource.relativeUri;
    // real uri parameter
    var realUriParameter = resource.uriParameters || {};
    for (var key in parentUriParameters) {
      realUriParameter[key] = parentUriParameters[key];
    }

    // add real uri and uri parameter to resource
    resource.realUri = realUri;
    resource.realUriParameter = realUriParameter;

    // if has resources
    if (!!resource.resources) {
      // the resource has resource
      // if resource has method.store it
      if (resource.methods) {
        apis[apis.length] = resource;
      }
      // add children
      getValidResource(realUri, realUriParameter, resource.resources, apis);
    } else {
      // the resource does not has child. store it
      apis[apis.length] = resource;
    }
  }
}