var express = require('express');
var app = express();
var mongoose = require('mongoose');
//var User = mongoose.model('User');
//var Userdata = mongoose.model('Userdata');
var util = require('../config/util.js');
//var Avatar = mongoose.model('Avatar');

var router = express.Router();
var app = express();
var OAuth2 = require('oauth').OAuth2;

var appKey = process.env.OAUTH_APP_KEY || 'f40aed227255370ccadaded6ba08ead3a73ae7f095c9dfe13519890e1eea8789';
var appSecret = process.env.OAUTH_APP_SECRET || 'a9eb14ecd3656e1d09a989342ede316236f8402bf06b03ff0e3e01c318222c5c';
var site = process.env.OAUTH_APP_PROVIDER_SITE || 'https://quiet-tor-5297.herokuapp.com';
var server_api_uri = process.env.OAUTH_PROVIDER_API_URI || 'https://quiet-tor-5297.herokuapp.com/api/users';
var auth_path = process.env.OAUTH_PROVIDER_AUTH_PATH || '/oauth/authorize';
var token_path = process.env.OAUTH_PROVIDER_TOKEN_PATH || '/oauth/token';
var redirect_callback = process.env.OAUTH_REDIRECT_URL || 'http://localhost:5000/chess4life-passport';
var scope = process.env.SCOPE || '';

var oauth2 = new OAuth2(appKey, appSecret, site, auth_path, token_path, null);

var authURL = oauth2.getAuthorizeUrl({
  redirect_uri: redirect_callback, 
  scope: [scope],
  response_type: 'code',
  state: '5UnYCNSWCLK'
});

router.get('/', function (req, res, next) {
  var code = req.query.code;
  var role = 'teacher'; 
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (req.query.role === 'kid') {
    role = 'kid';
  }
  if(!code){
    res.redirect(authURL);
  } else {
    oauth2.getOAuthAccessToken(
      code,
      {
        'redirect_uri': redirect_callback,
        'grant_type': 'authorization_code'
      },
      function (e, access_token, refresh_token, results){
        if (e) {
        	console.log(e);
        	console.log(1);
          return res.end('<script>window.close();</script>');
        } else if (results.error) {
        	console.log(2);
            console.log(results.error);
            res.end(JSON.stringify(results));
        } else {
        	console.log(3);
          console.log('Obtained access_token: ', access_token);
          if(!access_token){
              req.flash('registerStatus', false);
              return res.end('<script>window.close();</script>');
          } 
          oauth2.get(server_api_uri, access_token, function (err, body, res2) {
        	  
            if(err){
            	console.log(err);
              req.flash('registerStatus', false);
              return res.end('<script>window.close();</script>');
            } 
            var json_obj = JSON.parse(body); 
            var email = json_obj.users[0].email;
            var name = json_obj.users[0].username;
            console.log(email);
            req.session.user = {
            		id:email,
            		email:email,
            		name:name,
            };

            req.flash('registerStatus', false);
            req.flash('registerSuccessMessage', 'Welcome ' + name + "!");
            return res.end('<script>window.close();</script>');
          });
        }
    });
  }

});

console.log('Express server started on port 3001');

module.exports = router;