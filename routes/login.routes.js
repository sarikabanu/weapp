var login = require('../controllers/login.server');

module.exports = {
    configure: function (app) {
        app.post('/login/:action', function (req, res) {
            if (req.params.action == 'Generateotp') {
                login.Generateotp(req.body, res);
            }
            if (req.params.action == 'Validateotp') {
                login.validateotp(req.body, res);
            }
            if (req.params.action == 'sendotp') {
                login.sendotp(req.body, res);
            }
            if (req.params.action == 'verifyotp') {
                login.verifyotp(req.body, res);
            }
        });
    }
};
