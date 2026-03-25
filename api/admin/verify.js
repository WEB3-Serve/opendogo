'use strict';

const { handleVerify } = require('../../backend/src/routes/admin');

module.exports = async function verifyApi(req, res) {
  return handleVerify(req, res);
};
