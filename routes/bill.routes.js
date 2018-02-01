var bill = require('../controllers/bill.server');

module.exports = {
    configure: function (app) {
        app.post('/Bill/:action', function (req, res) {
            if (req.params.action == 'Scanimages') {
                bill.Scanimages(req.body, res);
            }
            if (req.params.action == 'Savebill') {
                bill.Savebill(req.body, res);
            }
            if (req.params.action == 'GetBillDetails') {
                bill.GetBillDetails(req.body, res);
            }
            if (req.params.action == 'UpdateBillDetails') {
                bill.UpdateBillDetails(req.body, res);
            }
            if (req.params.action == 'UpdateBillAndInviteMembers') {
                bill.UpdateBillAndInviteMembers(req.body, res);
            }
            if (req.params.action == 'InviteBillMembers') {
                bill.InviteBillMembers(req.body, res);
            }
            if (req.params.action == 'InviteBillMembers') {
                bill.InviteBillMembers(req.body, res);
            }
            if (req.params.action == 'Removebillinvites') {
                bill.Removebillinvites(req.body, res);
            }
            if (req.params.action == 'Draftbill') {
                bill.Draftbill(req.body, res);
            }
            if (req.params.action == 'DeleteBill') {
                bill.DeleteBill(req.body, res);
            }
            if (req.params.action == 'UpdateInvPayment') {
                bill.UpdateInvPayment(req.body, res);
            }
            if (req.params.action == 'UpdateOrgPayment') {
                bill.UpdateOrgPayment(req.body, res);
            }
        });
    }
};