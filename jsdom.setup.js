var JSDOM = require('jsdom').JSDOM;

JSDOM.fromFile('index.html').then(dom => {
  global.window = dom.window;
  global.image = dom.window.image;
  global.node = dom.window.node;
  global.document = dom.window.document;

  Object.keys(global.document).forEach(property => {
    if (typeof global[property] === 'undefined') {
      global[property] = global.document[property];
    }
  });

  global.navigator = {
    userAgent: 'node.js'
  };
});
