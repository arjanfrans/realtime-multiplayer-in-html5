'use strict';

require('!style-loader!css-loader!sass-loader!../scss/primer.scss');
require('!style-loader!css-loader!sass-loader!../scss/game.scss');

const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./containers/App');

ReactDOM.render(<App />, document.getElementById('app'));
