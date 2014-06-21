// example code to respond to a http request and connect to a mysql server
// src:   http://blog.loadimpact.com/2013/02/01/node-js-vs-php-using-load-impact-to-visualize-node-js-efficency/

// Include http module and mysql
var http = require('http'),
express = require('express'),
logfmt = require('logfmt'),
mysql = require("mysql");  // https://github.com/felixge/node-mysql

var app = express();
app.use(logfmt.requestLogger());

var port = Number(process.env.PORT || 5000);

// Create the connection.
// Data is default to new mysql installation and should be changed according to your configuration.
var connection = mysql.createConnection({
   //debug: true,
   //multipleStatements: true,
   host: 'localhost',
   user: "jbeaman",
   password: "localp@55",
   database: "ar_app"
});

// database connection
connection.connect();

// Create the http server.
http.createServer(function (request, response) {
   
   // handle favicon.ico (404) - chrome and safari
   if(request.url === '/favicon.ico') {
        //console.log('Favicon was requested');
        response.writeHead(404);
        response.end();
   } else {
      
      // connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
      // connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, rows, fields) {       // connection.escape

      connection.query(sqlStore.usersLocation, [37.40493,-121.8800,3], function(err, rows, fields) {
         if (err) throw err;

         //response.end('The solution is: ' + rows[0].username);
         removeNulls(rows);
         
         console.log(sqlStore.usersLocation);

         response.writeHead(200, {'Content-Type': 'application/json'});
         response.end(JSON.stringify(rows));
      });

   //connection.end();
   }

// Listen on the 8080 port.
}).listen( port );


// UTILS

   // Compact arrays with null entries; delete keys from objects with null value
   function removeNulls (obj) {
      var isArray = obj instanceof Array;
      for (var k in obj){
         if (obj[k] === null) isArray ? obj.splice(k,1) : delete obj[k];
         else if (typeof obj[k]=="object") removeNulls(obj[k]);
      }
   }
   
   // allows for multiline blocks of text / templates
   // usage: multiline(function() {/*! \n\n */});
   // todo: replace EcmaScript 6 will introduce template strings ${}
   function multiline (f) {
      return f.toString().
         replace(/^[^\/]+\/\*!?/, '').
         replace(/\*\/[^\/]+$/, '');
   }



// SQL QUERY Storage for all the multiline sql statements
// todo: replace EcmaScript 6 will introduce template strings ${}
var sqlStore = {
   test:  'here is a test message',
   
   // get all users
   users : multiline(function() {/*!
      SELECT u.*, loc.lat, loc.long 
      FROM users as u 
      LEFT JOIN user_locations as loc ON loc.userId = u.id;
   */}),
   
   // get user by id
   // @param   user.id
   userById : multiline(function() {/*!
      SELECT u.*, loc.lat, loc.long 
      FROM users as u 
      LEFT JOIN user_locations as loc ON loc.userId = u.id
      WHERE u.id = ?;
   */}),


   // get users by location (radius)
   // @param   latitude point
   // @param   longitude point
   // @param   radius (in miles)
   // @param   distance_unit (69.0 for miles, 111.045 for km)
   usersLocation : multiline(function() {/*!
      SELECT u.*, loc.lat, loc.long,
         TRUNCATE (p.distance_unit * DEGREES(ACOS(COS(RADIANS(p.latpoint))
                       * COS(RADIANS(loc.lat))
                       * COS(RADIANS(p.longpoint - loc.long))
                       + SIN(RADIANS(p.latpoint))
                       * SIN(RADIANS(loc.lat)))), 4) AS distance
      FROM users as u
         LEFT JOIN user_locations as loc ON loc.userId = u.id

         JOIN (   # these are the query parameters
               SELECT ? AS latpoint, ? AS longpoint, ? AS radius, 69.0 AS distance_unit
         ) AS p

      WHERE
         loc.lat
           BETWEEN p.latpoint  - (p.radius / p.distance_unit)
               AND p.latpoint  + (p.radius / p.distance_unit)
          AND loc.long
           BETWEEN p.longpoint - (p.radius / (p.distance_unit * COS(RADIANS(p.latpoint))))
               AND p.longpoint + (p.radius / (p.distance_unit * COS(RADIANS(p.latpoint))))
      ORDER BY distance
      LIMIT 15;
   */})

   // note: uses multi sql, open to sql injection attacks, and returns 4 results objects to node-mysql
   /*usersLocation.bak : multiline(function() {/*!
      SET @latpoint = 37.40493;
      SET @longpoint = -121.8800;
      SET @radius = 2;
      SET @distance_unit = 69;


      SELECT u.*, loc.lat, loc.long,
         @distance_unit * DEGREES(ACOS(COS(RADIANS(@latpoint))
                       * COS(RADIANS(loc.lat))
                       * COS(RADIANS(@longpoint - loc.long))
                       + SIN(RADIANS(@latpoint))
                       * SIN(RADIANS(loc.lat)))) AS distance
      FROM users as u
         LEFT JOIN user_locations as loc ON loc.userId = u.id
         
      WHERE
         loc.lat
           BETWEEN @latpoint  - (@radius / @distance_unit)
               AND @latpoint  + (@radius / @distance_unit)
          AND loc.long
           BETWEEN @longpoint - (@radius / (@distance_unit * COS(RADIANS(@latpoint))))
               AND @longpoint + (@radius / (@distance_unit * COS(RADIANS(@latpoint))))
   })*/
}