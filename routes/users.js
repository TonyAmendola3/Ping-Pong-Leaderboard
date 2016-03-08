var express = require('express'),
		router = express.Router(),
		mongoose = require('mongoose');

/* GET users listing. */
router.route('/')
	.get(function(req, res, next) {
		mongoose.model('Winner').find({}, function(err, winners) {
			if(err) {
				return console.error(err);
			} else {
				res.format({
					html: function(){
						res.render('users/login', {
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
	})
	//POST a new winner
	.post(function(req, res) {
		//get values from the POST request
		var userToAdd = mongoose.model('Winner')({
			username: req.body.username,
			password: req.body.password,
			wins: req.body.wins,
			losses: req.body.losses
		});

		userToAdd.save(function(err) {
			if(err) {
				throw err;
			} 

			mongoose.model('Winner').getAuthenticated(this.username, this.password, function(err, user, reason) {
				if(err) {
					throw err;
				}

				if(user) {
					console.log('POST creating new winner: ' + winner);
					res.format({
						html: function(){
							res.location('users');
							res.redirect('../winners');
						},
						json: function(){
							res.json(winner);
						}
					});
				}

				var reasons = User.failedLogin;
				switch (reason) {
					case reasons.NOT_FOUND:
					case reasons.PASSWORD_INCORRECT:
						break;
					case reasons.MAX_ATTEMPTS:
						break;
				}
			});
		});
	});

router.get('/new', function(req, res) {
	res.render('users/new', { title: 'add a new winner' });
});

router.get('/login', function(req, res) {
	res.render('users/login', { title: 'login' });
});

router.post('/login', function(req, res) {
	mongoose.model('Winner').getAuthenticated(req.body.username, req.body.password, function(err, user, reason) {
		if (err) {
			return console.error(err);
		}

		if (user) {
			console.log('login success');
			return;
			//redirect to go here
		}

		var reasons = mongoose.model('Winner').failedLogin;
		switch (reason) {
			case reasons.NOT_FOUND:
			case reasons.PASSWORD_INCORRECT:
				break;
			case reasons.MAX_ATTEMPTS:
				break;
		}
	});
});

module.exports = router;
