var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'ziviz',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'ziviz',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

