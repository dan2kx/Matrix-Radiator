var JSDOM = require('jsdom').JSDOM;

var exposedProperties = ['window', 'navigator', 'document'];

var dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

global.window = dom.window;
global.document = dom.window.document;

Object.keys(global.document).forEach(property => {
  if (typeof global[property] === 'undefined') {
    global[property] = global.document[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};
