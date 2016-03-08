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

//build the REST operations at the base for winners
//this will be accessible from localhost/winners if the default route for / is left unchanged
router.route('/')
	//GET all winners
	.get(function(req, res, next) {
		mongoose.model('Winner').find({}, function(err, winners) {
			if(err) {
				return console.error(err);
			} else {
				res.format({
					html: function(){
						res.render('winners/index', {
							title: 'All the Winners',
							'winners': winners
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
		mongoose.model('Winner').findById(id, function(err, winner) {
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
		mongoose.model('Winner').findById(req.id, function (err, winner) {
			if(err) {
				console.log('GET error: there was a problem retrieving: ' + err);
			} else {
				console.log('GET retrieving ID: ' + winner._id);

				res.format({
					html: function() {
						res.render('winners/show', {
							'winner': winner
						});
					},
					json: function(){
						res.json(winner);
					}
				});
			}
		});
	});

router.get('/:id/edit', function(req, res) {
	//search for a winner in mongo
	mongoose.model('Winner').findById(req.id, function(err, winner) {
		if(err) {
			console.log('GET error: there was a problem retrieving: ' + err);
		} else {
			//return the winner
			console.log('GET retrieving id: ' + winner._id);

			res.format({
				//html that will render the edit.jade template
				html: function() {
					res.render('winners/edit', {
						title: 'Winner' + winner._id,
						'winner': winner
					});
				},
				json: function() {
					res.json(winner);
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
	mongoose.model('Winner').findById(req.id, function(err, winner) {
		//update the winner
		winner.update({
			username: username,
			password: password,
			wins: wins,
			losses: losses
		}, function(err, winnerID) {
			if(err) {
				res.send('there was a problem updating the info in the db: ' + err);
			} else {
				res.format({
					html: function(){
						res.redirect('/winners/' + winner._id);
					}, 
					json: function(){
						res.json(winner);
					}
				});
			}
		});
	});
});

//delete a winner ... maybe they quit maybe they got canned .. who knows
router.delete('/:id/edit', function(req, res){
	mongoose.model('Winner').findById(req.id, function(err, winner){
		if(err){
			return console.error(err);
		} else {
			//remove the winner from mongo
			winner.remove(function(err, winner){
				if(err){
					return console.error(err);
				} else {
					console.log('delete removing ID: ' + winner._id);

					res.format({
						html: function(){
							res.redirect('/winners');
						},
						json: function(){
							res.json({message: 'deleted',
												item: winner
							});
						}
					});
				}
			});
		}
	});
});

module.exports = router;