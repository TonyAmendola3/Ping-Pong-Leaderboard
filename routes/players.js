var express = require('express'),
		router = express.Router(),
		mongoose = require('mongoose'),
		bodyParser = require('body-parser'),
		methodOverride = require('method-override');


router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res) {
	if(req.body && typeof req.body === 'object' && '_method' in req.body) {
		//look in urlencoded POST bodies and delete it
		var method = req.body._method;
		delete req.body._method;
		return method;
	}
}));

//build the REST operations at the base for players
//this will be accessible from localhost/players if the default route for / is left unchanged
router.route('/')
	//GET all players
	.get(function(req, res, next) {
		mongoose.model('Player').find({}, function(err, players) {
			if(err) {
				return console.error(err);
			} else {
				res.format({
					html: function(){
						res.render('players/index', {
							title: 'All the Players',
							'players': players
						});
					},
					json: function(){
						res.json(infophotos);
					}
				});
			}
		});
	});

//route middleware to validate :id
router.param('id', function(req, res, next, id) {
	if (id) {
		//find ID in the DB
		mongoose.model('Player').findById(id, function(err, players) {
			//respond with 404 if its not found
			if(err){
				console.log(id + ' was not found');
				res.status(404);
				var err = new Error('not found');
				err.status = 404;
				res.format({
					html: function(){
						next(err);
					},
					json: function(){
						res.json({message: err.status + ' ' + err});
					}
				});
			} else {
				//if its found we continue
				//once validation is done save the new item in the req
				req.id = id;
				next();
			}
		});
	}
});

router.route('/:id')
	.get(function(req, res) {
		mongoose.model('Player').findById(req.id, function (err, player) {
			if(err) {
				console.log('GET error: there was a problem retrieving: ' + err);
			} else {
				console.log('GET retrieving ID: ' + player._id);

				res.format({
					html: function() {
						res.render('players/show', {
							'player': player
						});
					},
					json: function(){
						res.json(player);
					}
				});
			}
		});
	});

router.get('/:id/edit', function(req, res) {
	//search for a player in mongo
	mongoose.model('Player').findById(req.id, function(err, player) {
		if(err) {
			console.log('GET error: there was a problem retrieving: ' + err);
		} else {
			//return the player
			console.log('GET retrieving id: ' + player.username);

			res.format({
				//html that will render the edit.jade template
				html: function() {
					res.render('players/edit', {
						title: 'Player' + player.username,
						'player': player
					});
				},
				json: function() {
					res.json(player);
				}
			});
		}
	});
});

router.put('/:id/edit', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var wins = req.body.wins;
	var losses = req.body.losses;

	//find doc by ID
	mongoose.model('Player').findById(req.id, function(err, player) {
		//update the player
		player.update({
			username: username,
			password: password,
			wins: wins,
			losses: losses
		}, function(err, playerID) {
			if(err) {
				res.send('there was a problem updating the info in the db: ' + err);
			} else {
				res.format({
					html: function(){
						res.redirect('/players/' + player._id);
					}, 
					json: function(){
						res.json(player);
					}
				});
			}
		});
	});
});

//delete a player ... maybe they quit maybe they got canned .. who knows
router.delete('/:id/edit', function(req, res){
	mongoose.model('Player').findById(req.id, function(err, player){
		if(err){
			return console.error(err);
		} else {
			//remove the player from mongo
			player.remove(function(err, player){
				if(err){
					return console.error(err);
				} else {
					console.log('delete removing ID: ' + player.username);

					res.format({
						html: function(){
							res.redirect('/players');
						},
						json: function(){
							res.json({message: 'deleted',
												item: player
							});
						}
					});
				}
			});
		}
	});
});

module.exports = router;