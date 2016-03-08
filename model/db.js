var mongoose = require('mongoose');

//set up database connection
var url = 'mongodb://localhost:27017/winnersdb';

mongoose.connect(url);