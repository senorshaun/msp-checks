const express = require('express');
const router = express.Router();
const session = require('express-session');
const cca = require('../utils/auth-msal');
const db = require('../db');


router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.returnTo || '/');
  }
  res.render('login',{});
});

router.get('/login', async (req, res) => {
  const authUrl = await cca.getAuthCodeUrl({
    scopes: process.env.AZURE_SCOPES.split(','),
    redirectUri: process.env.AZURE_REDIRECT_URI
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
	const tokenRequest = {
		code: req.query.code,
		scopes: process.env.AZURE_SCOPES.split(','),
		redirectUri: process.env.AZURE_REDIRECT_URI
	};
	const response = await cca.acquireTokenByCode(tokenRequest);
	const user = await db.query(`CALL get_user_by_oid(?)`, [response.account.homeAccountId]);
	if (!user[0][0][0]) {
		const newUser = await db.query(`CALL create_user(?,?,?)`, [
			response.account.name,
			response.account.username,
			response.account.homeAccountId
		]);
		req.session.user = newUser[0][0][0];
	} else {
		req.session.user = user[0][0][0];
	}
	if (!req.session.user.username.endsWith(process.env.AZURE_ALLOWED_DOMAIN)) {
		return res.status(403).send('Unauthorized');
	}
	res.redirect(req.session.returnTo || '/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
	  res.redirect('/auth');
  });
});

module.exports = router;