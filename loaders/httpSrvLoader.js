const config = require.main.require('./lib/config');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const compression = require('compression');
const pug = require('pug');
const helmet = require('helmet')
const routeInitializer = require.main.require('./routes');

module.exports = () => {
  // Create Express app and init routes
  const app = express();

  // default settings
  app.set('strict routing', true);
  app.set('trust proxy', true);

  // sessions
  app.use(session({
    secret: 'Thinking2020Home',
    resave: true,
    saveUninitialized: true,
  }));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(compression());

  // template engine
  app.engine('pug', pug.__express)
  app.set('view engine', 'pug');
  app.set('views', path.resolve('./views'));
  app.locals.pretty = true; // readable generated HTML code

  // minimal security
  app.use(helmet());

  routeInitializer(app);

  // Start HTTP server
  const httpserver = app.listen(config.http.port, () => {
    logger.info("[HTTP] Webserver listening at http://%s:%s", httpserver.address().address, httpserver.address().port)
  })

  global.httpserver = httpserver;
  global.app = app;

  return app;
}
