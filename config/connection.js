var mysql = require('mysql');

function Connection() {
  this.pool = null;

  this.init = function() {
    this.pool = mysql.createPool({
      connectionLimit: 10,
      host: '50.62.209.76',  //'localhost',//,////'50.62.209.76',//// //
      user: 'weapp',  //'root',//,////'weapp',////,
      password: 'weapp@123',  //'1324',//////'weapp@123',// //,
      database: 'weapp'   //'weapp'
    });
  };

  this.acquire = function(callback) {
    this.pool.getConnection(function(err, connection) {
      callback(err, connection);
    });
  };
}

module.exports = new Connection();
