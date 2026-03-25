'use strict';

const { handleLogin } = require('../../backend/src/routes/admin');

module.exports = async function loginApi(req, res) {
  return handleLogin(req, res);
};
