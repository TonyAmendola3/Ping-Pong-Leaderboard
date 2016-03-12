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
router.param('username', function(req, res, next, username) {
	if (username) {
		//find ID in the DB
		mongoose.model('Player').find({username: username}, function(err, players) {
			//respond with 404 if its not found
			if(err){
				console.log(username + ' was not found');
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
				req.username = username;
				next();
			}
		});
	}
});

router.route('/:username')
	.get(function(req, res) {
		mongoose.model('Player').find({username: req.username}, function (err, player) {
			if(err) {
				console.log('GET error: there was a problem retrieving: ' + err);
			} else {
				console.log('GET retrieving ID: ' + player[0].username);

				res.format({
					html: function() {
						res.render('players/show', {
							'player': player[0]
						});
					},
					json: function(){
						res.json(player[0]);
					}
				});
			}
		});
	});

router.get('/:username/edit', function(req, res) {
    //search for a player in mongo
    mongoose.model('Player').find({username: req.username}, function(err, player) {
        if(req.session.user.username === player[0].username){
            if(err) {
                console.log('GET error: there was a problem retrieving: ' + err);
            } else {
                //return the player
                console.log('GET retrieving id: ' + player[0].username);

                res.format({
                    //html that will render the edit.jade template
                    html: function() {
                        res.render('players/edit', {
                            title: 'Player' + player[0].username,
                            'player': player[0]
                        });
                    },
                    json: function() {
                        res.json(player[0]);
                    }
                });
            }
        } else {
            console.log(err);
            res.redirect('/players');
        }
    });
});

router.put('/:username/edit', function(req, res) {
    var newUsername = req.body.username;
    var newWins = req.body.wins;
    var newLosses = req.body.losses;

    //find doc by ID
    mongoose.model('Player').find({username: req.username}, function(err, player) {
        //update the player
        player[0].update({
            username: newUsername,
            wins: newWins,
            losses: newLosses
        }, function(err, playerUsername) {
            if(err) {
                res.send('there was a problem updating the info in the db: ' + err);
            } else {
                res.format({
                    html: function(){
                        res.redirect('/players/' + player[0].username);
                    }, 
                    json: function(){
                        res.json(player[0]);
                    }
                });
            }
        });
    });
});

module.exports = router;