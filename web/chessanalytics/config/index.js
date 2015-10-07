var nconf = require('nconf');

nconf.argv().env().file({file: './config/production.json'});

nconf.defaults({
	mongo_port: '27017',
	mongo_host: 'localhost',
	mongo_db: 'mongodb://localhost/Chess',//
	port: 8083,
	url: 'http://127.0.0.1:8083',
	default_depth: 5,
	session_secret: "goes-in-production.json",
	socket_log_level: 3,
	transports: 'websocket',
	database_host: 'localhost',
	database_username: 'chess',
	database_password: '46^Bc8nj',//
	database_name: 'chess'
});