var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10,
    MAX_LOGIN_ATTEMPTS = 5,
    LOCK_TIME = 2 * 60 * 60 * 1000;

var winnerSchema = new mongoose.Schema({
	username: { type: String, required: true, index: {unique: true} },
	password: { type: String, required: true },
	wins: Number,
	losses: Number,
	loginAttempts: { type: Number, required: true, default: 0 },
	lockUntil: { type: Number }
});

winnerSchema.pre('save', function(next) {
	var user = this;

	if(!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if(err) {
			return next(err);
		}

		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) {
				return next(err);
			}

			user.password = hash;
			next();
		});
	});
});

winnerSchema.virtual('isLocked').get(function(){
	return !!(this.lockUntil && this.lockUntil > Date.now());
});

winnerSchema.methods.comparePassword = function(candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) {
			return callback(err);
		}

		callback(null, isMatch);
	});
};

winnerSchema.methods.incLoginAttempts = function(callback) {
	if (this.lockUntil && this.lockUntil < Date.now()) {
		return this.update({
			$set: {loginAttempts: 1},
			$unset: {lockUntil: 1}
		}, callback);
	}

	var updates = {
		$inc: { loginAttempts: 1 }
	};

	if(this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
		updates.$set = {
			lockUntil: Date.now() + LOCK_TIME
		};
	}

	return this.update(updates, callback);
};

var reasons = winnerSchema.statics.failedLogin = {
	NOT_FOUND: 0,
	PASSWORD_INCORRECT: 1,
	MAX_ATTEMPTS: 2
};

winnerSchema.statics.getAuthenticated = function(username, password, callback) {
	this.findOne({ username: username }, function(err, user) {
		if (err) {
			return callback(err);
		}

		if (!user) {
			return callback(null, null, reasons.NOT_FOUND);
		}

		if (user.isLocked) {
			return user.incLoginAttempts(function(err) {
				if (err) {
					return callback(err);
				}

				return callback(null, null, reasons.MAX_ATTEMPTS);
			});
		}

		user.comparePassword(password, function(err, isMatch) {
			if (err) {
				return callback(err);
			}

			if (isMatch) {
				if (!user.loginAttempts && !user.lockUntil) {
					return callback(null, user);
				}

				var updates = {
					$set: { loginAttempts: 0 },
					$unset: { lockUntil: 1}
				};

				return user.update(updates, function(err) {
					if(err) {
						return callback(err);
					}

					return callback(null, user);
				});
			}

			user.incLoginAttempts(function(err) {
				if (err) {
					return callback(err);
				}

				return callback(null, null, reasons.PASSWORD_INCORRECT);
			});
		});
	});
};

mongoose.model('Winner', winnerSchema);