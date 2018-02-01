var Profile = require('../controllers/users.server');

module.exports = {
    configure: function (app) {
        app.post('/User/:action', function (req, res) {
            if (req.params.action == 'CreateProfile') {
                Profile.CreateProfile(req.body, res);
            }
            if (req.params.action == 'GetProfileDetails') {
                Profile.GetProfileDetails(req.body, res);
            }
            if (req.params.action == 'UpdateProfile') {
                Profile.UpdateProfile(req.body, res);
            }
            if (req.params.action == 'UpdateProfilePic') {
                Profile.UpdateProfilePic(req.body, res);
            }
            if (req.params.action == 'GetUserDetails') {
                Profile.GetUserDetails(req.body, res);
            }
            if (req.params.action == 'UpdatePhoneNo') {
                Profile.UpdatePhoneNo(req.body, res);
            }
            if (req.params.action == 'Updatetoken') {
                Profile.Updatetoken(req.body, res);
            }
            if (req.params.action == 'Updatepaypal') {
                Profile.Updatepaypal(req.body, res);
            }

            if (req.params.action == 'Reportaproblem') {
                Profile.Reportaproblem(req.body, res);
            }
        });
    }
};