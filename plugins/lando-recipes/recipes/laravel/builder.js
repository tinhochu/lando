'use strict';

// Modules
const _ = require('lodash');

/*
 * Helper to get cache
 */
const getCache = cache => {
  // Return redis
  if (_.includes(cache, 'redis')) {
    return {
      type: cache,
      portforward: true,
      persist: true,
    };
  // Or memcached
  } else if (_.includes(cache, 'memcached')) {
    return {
      type: cache,
      portforward: true,
    };
  }
};

/*
 * Build WordPress
 */
module.exports = {
  name: 'laravel',
  parent: '_lamp',
  config: {
    confSrc: __dirname,
    config: {},
    composer: {},
    database: 'mysql',
    defaultFiles: {
      php: 'php.ini',
    },
    php: '7.2',
    services: {appserver: {overrides: {environment: {
      APP_LOG: 'errorlog',
    }}}},
    tooling: {laravel: {service: 'appserver'}},
    via: 'apache',
    webroot: '.',
    xdebug: false,
  },
  builder: (parent, config) => class LandoLaravel extends parent {
    constructor(id, options = {}) {
      options = _.merge({}, config, options);
      // Add the laravel cli installer command
      options.composer['laravel/installer'] = '*';
      // Add in artisan tooling
      // @NOTE: does artisan always live one up of the webroot?
      options.tooling.artisan = {
        service: 'appserver',
        cmd: `php /app/${options.webroot}/../artisan`,
      };
      if (_.has(options, 'cache')) options.services.cache = getCache(options.cache);
      // Set the default vhosts if we are nginx
      if (options.via === 'nginx') options.defaultFiles.vhosts = 'default.conf.tpl';
      // Set the default mysql if we are there as well
      if (options.database !== 'postgres') options.defaultFiles.database = 'mysql.cnf';
      // Send downstream
      super(id, options);
    };
  },
};
