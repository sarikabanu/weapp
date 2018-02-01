var contacts = require('../controllers/contacts.server');

module.exports = {
    configure: function (app) {
        app.post('/contacts/:action', function (req, res) {
            if (req.params.action == 'CreateGroup') {
                contacts.CreateGroup(req.body, res);
            }
            if (req.params.action == 'AddGroupContacts') {
                contacts.AddGroupContacts(req.body, res);
            }
            if (req.params.action == 'DeleteGroup') {
                contacts.DeleteGroup(req.body, res);
            }
            if (req.params.action == 'RemoveUserFromGroup') {
                contacts.RemoveUserFromGroup(req.body, res);
            }
            if (req.params.action == 'GetGroupDetails') {
                contacts.GetGroupDetails(req.body, res);
            }
        });
    }
};