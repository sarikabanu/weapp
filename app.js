var express = require('express');
var bodyParser = require('body-parser');
require('./config/Global');
connection = require('./config/connection');

var app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

connection.init();

router = express.Router();
_Routes.user.configure(app);
_Routes.login.configure(app);
_Routes.bill.configure(app);
_Routes.contacts.configure(app);


var server = app.listen(process.env.PORT || 3000, function() {
  console.log('Server listening on port ' + server.address().port);
});


