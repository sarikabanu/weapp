var ProcessString = require('../sdk/ProcessString.js');

function bill() {
    this.Scanimages = function (req, res) {
        var appId = GLOBAL.OCR_appid;
        var password = GLOBAL.OCR_password;
        var FileName = uuid.v1() + '.jpg';
        UploadFilesToS3(req.image, FileName);
        try {
            var ocrsdkModule = require('' + path.dirname(require.main.filename) + '/sdk/ocrsdk.js');
            var ocrsdk = ocrsdkModule.create(appId, password);
            ocrsdk.serverUrl = "http://cloud.ocrsdk.com";

            function downloadCompleted(status) {
                if (status != null) {
                    var data = status.toLowerCase();
                    var bill_url = FileName;
                    var total_amt = ProcessString.GetTotalAmount(data);
                    var subtotal_amt = ProcessString.GetSubTotalAmount(data);
                    var res_obj = new Object();
                    res_obj.total = parseFloat(parseFloat(total_amt).toFixed(2));
                    res_obj.subtotal = parseFloat(parseFloat(subtotal_amt).toFixed(2));
                    res_obj.tax = '';
                    res_obj.items = ProcessString.GetItemsList(data);
                    res_obj.bill_url = bill_url;
                    res.send({status: 1, message: '', content: res_obj});

                    return;
                }
            }

            function processingCompleted(error, taskData) {
                if (error) {
                    return;
                }

                if (taskData.status != 'Completed') {
                    return;
                }
                ocrsdk.downloadResult(taskData.resultUrl.toString(), downloadCompleted);
            }

            function uploadCompleted(error, taskData) {
                if (error) {
                    return;
                }

                if (!ocrsdk.isTaskActive(taskData)) {
                    return;
                }

                ocrsdk.waitForCompletion(taskData.id, processingCompleted);
            }

            var settings = new ocrsdkModule.ProcessingSettings();
            settings.language = "English";
            settings.exportFormat = "txtUnstructured";
            var imgs=req.image.replace(/^data:image\/\w+;base64,/, "");
            ocrsdk.processImage(new Buffer(imgs, 'base64'), settings, uploadCompleted);

        }
        catch (err) {
            res.send({status: 0, message: 'An Error Occured', content: ''});
        }
    };

    this.Savebill = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID,p.NAME from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            req.user_id = result[0].USER_ID;
                            req.user_name = result[0].NAME;
                            if (req.bill_id == undefined) {
                                var obj = new Object();
                                req.user_id = obj.CREATER_ID = result[0].USER_ID;
                                req.bill_id = obj.BILL_ID = uuid.v1();
                                obj.AMOUNT = req.amount;
                                obj.NAME = req.bill_name;
                                obj.BILL_URL = req.bill_url;
                                obj.TIPS = req.bill_tips;
                                obj.STATUS_ID = 0;
                                obj.DRAFT_STATUS = 0;
                                obj.CREATED_DATE = new Date();
                                obj.MODIFIED_DATE = new Date();
                                con.query('insert into t_bill set ?', obj, function (err, result) {
                                    if (err) {
                                        res.send({status: 0, message: 'Failed to save the bill', content: ''});
                                    }
                                    else {
                                        for (var i = 0; i < req.items.length; i++) {
                                            var items_obj = new Object();
                                            items_obj.ID = uuid.v1();
                                            items_obj.BILL_ID = req.bill_id;
                                            items_obj.NAME = req.items[i].item_name;
                                            items_obj.AMOUNT = req.items[i].item_price;
                                            items_obj.QUANTITY = "1";
                                            items_obj.CREATER_ID = req.user_id;
                                            items_obj.MODIFIER_ID = req.user_id;
                                            items_obj.CREATED_DATE = new Date();
                                            items_obj.MODIFIED_DATE = new Date();
                                            con.query('Insert into t_billitems set ?', items_obj, function (err, result) {

                                            });
                                        }
                                    }
                                    function doQuery1() {
                                        var defered = Q.defer();
                                        con.query("select USER_ID,PH_NUM,USER_TOKEN from t_profile p inner join t_userbridge b on b.ID=p.BRIDGE_ID", defered.makeNodeResolver());
                                        return defered.promise;
                                    }

                                    Q.all([doQuery1()]).then(function (results) {
                                        var result1 = results[0][0];
                                        for (var i = 0; i < req.invitees.length; i++) {
                                            var userid = '';
                                            var obj = new Object();
                                            for (var j = 0; j < result1.length; j++) {
                                                if (req.invitees[i].contact_no.indexOf(result1[j].PH_NUM) > -1 || result1[j].PH_NUM.indexOf(req.invitees[i].contact_no) > -1) {
                                                    userid = result1[j].USER_ID;
                                                    sendnotification('You have been added in the bill by ' + req.user_name + '.',result1[j].USER_TOKEN);
                                                    break;
                                                }
                                            }
                                            var inv_obj = new Object();
                                            inv_obj.INVITE_ID = uuid.v1();
                                            inv_obj.BILL_ID = req.bill_id;
                                            inv_obj.USER_ID = userid;
                                            inv_obj.NAME = req.invitees[i].contact_name;
                                            inv_obj.PHONE_NUMBER = req.invitees[i].contact_no;
                                            inv_obj.PHOTO = req.invitees[i].contact_pic;
                                            inv_obj.AMOUNT = req.invitees[i].amount;
                                            inv_obj.INV_CODE = '123123';
                                            inv_obj.PAYMENT_MODE = 0;
                                            inv_obj.STATUS_ID = 0;
                                            inv_obj.CREATED_DATE = new Date();
                                            inv_obj.MODIFIED_DATE = new Date();
                                            con.query('insert into t_bill_invitation set ?', inv_obj, function (err, result) {

                                            });
                                            var not_obj = new Object();
                                            not_obj.id = uuid.v1();
                                            not_obj.TITLE = '';
                                            not_obj.STATUS_ID = 1;
                                            not_obj.MODULE_TYPE = 1;
                                            not_obj.ALERT_ID = req.bill_id;
                                            not_obj.USER_ID = userid;
                                            not_obj.CREATED_DATE = new Date();
                                            con.query('insert into t_notification set ?', not_obj, function (err, result) {

                                            });
                                        }
                                        res.send({status: 1, message: 'Bill Saved Sucessfully', content: ''});
                                    });
                                });
                            }
                            else {
                                con.query('delete from t_billitems where bill_id=?', [req.bill_id], function (err, result) {
                                    if (!err) {
                                        con.query('delete from t_bill_invitation where bill_id=?', [req.bill_id], function (err, result) {
                                            if (result.affectedRows == 0) {
                                                res.send({status: 0, message: 'Failed to save the bill', content: ''});
                                            }
                                            else {
                                                con.query('delete from t_bill where bill_id=? and DRAFT_STATUS=1', [req.bill_id], function (err, result) {
                                                    if (result.affectedRows == 0) {
                                                        res.send({
                                                            status: 0,
                                                            message: 'Failed to save the bill',
                                                            content: ''
                                                        });
                                                    }
                                                    else {
                                                        var obj = new Object();
                                                        req.bill_id = obj.BILL_ID = uuid.v1();
                                                        obj.AMOUNT = req.amount;
                                                        obj.NAME = req.bill_name;
                                                        obj.BILL_URL = req.bill_url;
                                                        obj.TIPS = req.bill_tips;
                                                        obj.STATUS_ID = 0;
                                                        obj.DRAFT_STATUS = 0;
                                                        obj.CREATER_ID = req.user_id;
                                                        obj.CREATED_DATE = new Date();
                                                        obj.MODIFIED_DATE = new Date();
                                                        con.query('insert into t_bill set ?', obj, function (err, result) {
                                                            if (err) {
                                                                res.send({
                                                                    status: 0,
                                                                    message: 'Failed to save the bill',
                                                                    content: ''
                                                                });
                                                            }
                                                            else {
                                                                for (var i = 0; i < req.items.length; i++) {
                                                                    var items_obj = new Object();
                                                                    items_obj.ID = uuid.v1();
                                                                    items_obj.BILL_ID = req.bill_id;
                                                                    items_obj.NAME = req.items[i].item_name;
                                                                    items_obj.AMOUNT = req.items[i].item_price;
                                                                    items_obj.QUANTITY = "1";
                                                                    items_obj.CREATER_ID = req.user_id;
                                                                    items_obj.MODIFIER_ID = req.user_id;
                                                                    items_obj.CREATED_DATE = new Date();
                                                                    items_obj.MODIFIED_DATE = new Date();
                                                                    con.query('Insert into t_billitems set ?', items_obj, function (err, result) {

                                                                    });
                                                                }
                                                            }
                                                            function doQuery1() {
                                                                var defered = Q.defer();
                                                                con.query("select USER_ID,PH_NUM,USER_TOKEN from t_profile p inner join t_userbridge b on b.ID=p.BRIDGE_ID", defered.makeNodeResolver());
                                                                return defered.promise;
                                                            }

                                                            Q.all([doQuery1()]).then(function (results) {
                                                                var result1 = results[0][0];
                                                                for (var i = 0; i < req.invitees.length; i++) {
                                                                    var userid = '';
                                                                    var obj = new Object();
                                                                    for (var j = 0; j < result1.length; j++) {
                                                                        if (req.invitees[i].contact_no.indexOf(result1[j].PH_NUM) > -1 || result1[j].PH_NUM.indexOf(req.invitees[i].contact_no) > -1) {
                                                                            sendnotification('You have been added in the bill by ' + req.user_name + '.',result1[j].USER_TOKEN);
                                                                            break;
                                                                        }
                                                                    }
                                                                    var inv_obj = new Object();
                                                                    inv_obj.INVITE_ID = uuid.v1();
                                                                    inv_obj.BILL_ID = req.bill_id;
                                                                    inv_obj.USER_ID = userid;
                                                                    inv_obj.NAME = req.invitees[i].contact_name;
                                                                    inv_obj.PHONE_NUMBER = req.invitees[i].contact_no;
                                                                    inv_obj.PHOTO = req.invitees[i].contact_pic;
                                                                    inv_obj.AMOUNT = req.invitees[i].amount;
                                                                    inv_obj.INV_CODE = '123123';
                                                                    inv_obj.PAYMENT_MODE = 0;
                                                                    inv_obj.STATUS_ID = 0;
                                                                    inv_obj.CREATED_DATE = new Date();
                                                                    inv_obj.MODIFIED_DATE = new Date();
                                                                    con.query('insert into t_bill_invitation set ?', inv_obj, function (err, result) {

                                                                    });

                                                                    var not_obj = new Object();
                                                                    not_obj.id = uuid.v1();
                                                                    not_obj.TITLE = '';
                                                                    not_obj.STATUS_ID = 1;
                                                                    not_obj.MODULE_TYPE = 1;
                                                                    not_obj.ALERT_ID = req.bill_id;
                                                                    not_obj.USER_ID = userid;
                                                                    not_obj.CREATED_DATE = new Date();
                                                                    con.query('insert into t_notification set ?', not_obj, function (err, result) {

                                                                    });
                                                                }
                                                                res.send({
                                                                    status: 1,
                                                                    message: 'Bill Saved Sucessfully',
                                                                    content: ''
                                                                });
                                                            });
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                        else {
                            res.send({status: 0, message: 'Profile Does not Exist', content: ''});
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({
                                status: -1,
                                message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                content: ''
                            });
                        }
                        else {
                            res.send({status: -1, message: 'Invalid User', content: ''});
                        }
                    });
                }
            });
        });
    };

    this.Draftbill = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            req.user_id = result[0].USER_ID;
                            if (req.bill_id == undefined) {
                                var obj = new Object();
                                obj.CREATER_ID = req.user_id;
                                req.bill_id = obj.BILL_ID = uuid.v1();
                                obj.AMOUNT = req.amount;
                                obj.NAME = req.bill_name;
                                obj.BILL_URL = req.bill_url;
                                obj.TIPS = req.bill_tips;
                                obj.STATUS_ID = 0;
                                obj.DRAFT_STATUS = 1;
                                obj.CREATED_DATE = new Date();
                                obj.MODIFIED_DATE = new Date();
                                con.query('insert into t_bill set ?', obj, function (err, result) {
                                    if (err) {
                                        res.send({status: 0, message: 'Failed to save the bill', content: ''});
                                    }
                                    else {
                                        for (var i = 0; i < req.items.length; i++) {
                                            var userid = '';
                                            var items_obj = new Object();
                                            items_obj.ID = uuid.v1();
                                            items_obj.BILL_ID = req.bill_id;
                                            items_obj.NAME = req.items[i].item_name;
                                            items_obj.AMOUNT = req.items[i].item_price;
                                            items_obj.QUANTITY = "1";
                                            items_obj.CREATER_ID = req.user_id;
                                            items_obj.MODIFIER_ID = req.user_id;
                                            items_obj.CREATED_DATE = new Date();
                                            items_obj.MODIFIED_DATE = new Date();
                                            con.query('Insert into t_billitems set ?', items_obj, function (err, result) {
                                            });
                                        }

                                        res.send({status: 1, message: 'bill Drafted Successfully', content: ''});
                                    }


                                    function doQuery1() {
                                        var defered = Q.defer();
                                        con.query("select USER_ID,PH_NUM from t_profile p inner join t_userbridge b on b.ID=p.BRIDGE_ID", defered.makeNodeResolver());
                                        return defered.promise;
                                    }

                                    Q.all([doQuery1()]).then(function (results) {
                                        var result1 = results[0][0];
                                        for (var i = 0; i < req.invitees.length; i++) {
                                            var userid = '';
                                            var obj = new Object();
                                            for (var j = 0; j < result1.length; j++) {
                                                if (req.invitees[i].contact_no.indexOf(result1[j].PH_NUM) > -1 || result1[j].PH_NUM.indexOf(req.invitees[i].contact_no) > -1) {
                                                    userid = result1[j].USER_ID;
                                                    break;
                                                }
                                            }
                                            var inv_obj = new Object();
                                            inv_obj.INVITE_ID = uuid.v1();
                                            inv_obj.BILL_ID = req.bill_id;
                                            inv_obj.USER_ID = userid;
                                            inv_obj.NAME = req.invitees[i].contact_name;
                                            inv_obj.PHONE_NUMBER = req.invitees[i].contact_no;
                                            inv_obj.PHOTO = req.invitees[i].contact_pic;
                                            inv_obj.AMOUNT = req.invitees[i].amount;
                                            inv_obj.INV_CODE = '123123';
                                            inv_obj.PAYMENT_MODE = 0;
                                            inv_obj.STATUS_ID = 0;
                                            inv_obj.CREATED_DATE = new Date();
                                            inv_obj.MODIFIED_DATE = new Date();
                                            con.query('insert into t_bill_invitation set ?', inv_obj, function (err, result) {

                                            });
                                        }
                                        res.send({status: 1, message: 'Bill Saved Sucessfully', content: ''});
                                    });
                                });
                            }
                            else {
                                con.query('delete from t_billitems where bill_id=?', [req.bill_id], function (err, result) {
                                    if (!err) {
                                        con.query('delete from t_bill_invitation where bill_id=?', [req.bill_id], function (err, result) {
                                            if (err) {
                                                res.send({status: 0, message: 'Failed to save the bill', content: ''});
                                            }
                                            else {
                                                con.query('delete from t_bill where bill_id=? and DRAFT_STATUS=1', [req.bill_id], function (err, result) {
                                                    if (result.affectedRows == 0) {
                                                        res.send({
                                                            status: 0,
                                                            message: 'Failed to save the bill',
                                                            content: ''
                                                        });
                                                    }
                                                    else {
                                                        var obj = new Object();
                                                        obj.CREATER_ID = req.user_id;
                                                        req.bill_id = obj.BILL_ID = uuid.v1();
                                                        obj.AMOUNT = req.amount;
                                                        obj.NAME = req.bill_name;
                                                        obj.BILL_URL = req.bill_url;
                                                        obj.TIPS = req.bill_tips;
                                                        obj.STATUS_ID = 0;
                                                        obj.DRAFT_STATUS = 1;
                                                        obj.CREATED_DATE = new Date();
                                                        obj.MODIFIED_DATE = new Date();
                                                        con.query('insert into t_bill set ?', obj, function (err, result) {
                                                            if (err) {
                                                                res.send({
                                                                    status: 0,
                                                                    message: 'Failed to save the bill',
                                                                    content: ''
                                                                });
                                                            }
                                                            else {
                                                                for (var i = 0; i < req.items.length; i++) {
                                                                    var userid = '';
                                                                    var items_obj = new Object();
                                                                    items_obj.ID = uuid.v1();
                                                                    items_obj.BILL_ID = req.bill_id;
                                                                    items_obj.NAME = req.items[i].item_name;
                                                                    items_obj.AMOUNT = req.items[i].item_price;
                                                                    items_obj.QUANTITY = "1";
                                                                    items_obj.CREATER_ID = req.user_id;
                                                                    items_obj.MODIFIER_ID = req.user_id;
                                                                    items_obj.CREATED_DATE = new Date();
                                                                    items_obj.MODIFIED_DATE = new Date();
                                                                    con.query('Insert into t_billitems set ?', items_obj, function (err, result) {
                                                                    });
                                                                }

                                                                res.send({
                                                                    status: 1,
                                                                    message: 'bill Drafted Successfully',
                                                                    content: ''
                                                                });
                                                            }


                                                            function doQuery1() {
                                                                var defered = Q.defer();
                                                                con.query("select USER_ID,PH_NUM from t_profile p inner join t_userbridge b on b.ID=p.BRIDGE_ID", defered.makeNodeResolver());
                                                                return defered.promise;
                                                            }

                                                            Q.all([doQuery1()]).then(function (results) {
                                                                var result1 = results[0][0];
                                                                for (var i = 0; i < req.invitees.length; i++) {
                                                                    var userid = '';
                                                                    var obj = new Object();
                                                                    for (var j = 0; j < result1.length; j++) {
                                                                        if (req.invitees[i].contact_no.indexOf(result1[j].PH_NUM) > -1 || result1[j].PH_NUM.indexOf(req.invitees[i].contact_no) > -1) {
                                                                            userid = result1[j].USER_ID;
                                                                            break;
                                                                        }
                                                                    }
                                                                    var inv_obj = new Object();
                                                                    inv_obj.INVITE_ID = uuid.v1();
                                                                    inv_obj.BILL_ID = req.bill_id;
                                                                    inv_obj.USER_ID = userid;
                                                                    inv_obj.NAME = req.invitees[i].contact_name;
                                                                    inv_obj.PHONE_NUMBER = req.invitees[i].contact_no;
                                                                    inv_obj.PHOTO = req.invitees[i].contact_pic;
                                                                    inv_obj.AMOUNT = req.invitees[i].amount;
                                                                    inv_obj.INV_CODE = '123123';
                                                                    inv_obj.PAYMENT_MODE = 0;
                                                                    inv_obj.STATUS_ID = 0;
                                                                    inv_obj.CREATED_DATE = new Date();
                                                                    inv_obj.MODIFIED_DATE = new Date();
                                                                    con.query('insert into t_bill_invitation set ?', inv_obj, function (err, result) {

                                                                    });
                                                                }
                                                                res.send({
                                                                    status: 1,
                                                                    message: 'Bill Saved Sucessfully',
                                                                    content: ''
                                                                });
                                                            });

                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                        else {
                            res.send({status: 0, message: 'Profile Does not Exist', content: ''});
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({
                                status: -1,
                                message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                content: ''
                            });
                        }
                        else {
                            res.send({status: -1, message: 'Invalid User', content: ''});
                        }
                    });
                }
            });
        });
    };

    this.GetBillDetails = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            req.id = result[0].USER_ID;

                            function doQuery1() {
                                var defered = Q.defer();
                                con.query("select BILL_ID as bill_id,name as bill_name,AMOUNT as bill_amount,DRAFT_STATUS as draft_status,TIPS as bill_tips,STATUS_ID as bill_status,CONCAT('" + GLOBAL.AWS_Images_Link + "',BILL_URL) as bill_image,created_date from t_bill where CREATER_ID=? order by created_date desc", [req.id], defered.makeNodeResolver());
                                return defered.promise;
                            }

                            function doQuery2() {
                                var defered = Q.defer();
                                con.query("select b.BILL_ID as bill_id,i.INVITE_ID as invite_id,b.name as bill_name,i.AMOUNT as bill_amount,TIPS as bill_tips,i.STATUS_ID as bill_status,CONCAT('" + GLOBAL.AWS_Images_Link + "',BILL_URL) as bill_image,b.CREATED_DATE,(select paypal_id from t_profile where user_id=b.CREATER_ID) as organiser_paypal_id from t_bill b inner join t_bill_invitation i on i.BILL_ID=b.BILL_ID where i.USER_ID=? order by b.CREATED_DATE desc", [req.id], defered.makeNodeResolver());
                                return defered.promise;
                            }

                            function doQuery3() {
                                var defered = Q.defer();
                                con.query("select INVITE_ID,i.BILL_ID as bill_id,if(user_id='',i.Name,(select Name from t_profile p where i.user_id=p.user_id)) as invitee_name,if(user_id='',PHONE_NUMBER,(select PH_NUM from t_userbridge b inner join t_profile p on p.BRIDGE_ID=b.ID where i.user_id=p.user_id)) as invitee_number,if(user_id='',PHOTO,(select CONCAT('" + GLOBAL.AWS_Images_Link + "',PROFILE_PIC) as PROFILE_PIC from t_profile p where i.user_id=p.user_id)) as invitee_image,i.STATUS_ID as status,i.AMOUNT as amount,i.payment_mode as payment_mode  from t_bill_invitation i inner join t_bill b on b.BILL_ID=i.BILL_ID where b.creater_id=?", [req.id], defered.makeNodeResolver());
                                return defered.promise;
                            }

                            function doQuery4() {
                                var defered = Q.defer();
                                con.query("select NAME,AMOUNT,QUANTITY,BILL_ID from t_billitems", [req.id], defered.makeNodeResolver());
                                return defered.promise;
                            }

                            Q.all([doQuery1(), doQuery2(), doQuery3(), doQuery4()]).done(function (results) {
                                var result1 = results[0][0];
                                var result2 = results[1][0];
                                var result3 = results[2][0];
                                var result4 = results[3][0];

                                var obj = new Object();
                                var hosted_obj = new Object();
                                var attending_obj = new Object();
                                var bill_arr = new Array();

                                if (result1.length != 0) {
                                    for (var i = 0; i < result1.length; i++) {
                                        var bill_obj = new Object();
                                        bill_obj.bill_id = result1[i].bill_id;
                                        bill_obj.bill_name = result1[i].bill_name;
                                        bill_obj.bill_amount = result1[i].bill_amount;
                                        bill_obj.bill_tips = result1[i].bill_tips;
                                        bill_obj.draft_status = result1[i].draft_status;
                                        bill_obj.bill_status = result1[i].bill_status;
                                        bill_obj.bill_image = result1[i].bill_image;
                                        var invited_arr = new Array();
                                        for (var j = 0; j < result3.length; j++) {
                                            if (result3[j].bill_id == result1[i].bill_id) {
                                                var invited_obj = new Object();
                                                invited_obj.invitee_id = result3[j].INVITE_ID;
                                                invited_obj.contact_no = result3[j].invitee_number;
                                                invited_obj.contact_name = result3[j].invitee_name;
                                                invited_obj.contact_pic = result3[j].invitee_image;
                                                invited_obj.amount = result3[j].amount;
                                                invited_obj.payment_mode = result3[j].payment_mode
                                                invited_obj.status = result3[j].status;
                                                invited_arr.push(invited_obj);
                                            }
                                        }
                                        var item = new Array();
                                        for (var k = 0; k < result4.length; k++) {
                                            if (result1[i].bill_id == result4[k].BILL_ID) {
                                                var item_obj = new Object();
                                                item_obj.item_name = result4[k].NAME;
                                                item_obj.item_price = result4[k].AMOUNT;
                                                item_obj.item_quantity = result4[k].QUANTITY;
                                                item.push(item_obj);
                                            }
                                        }
                                        bill_obj.items = item;
                                        bill_obj.invitees = invited_arr;
                                        bill_arr.push(bill_obj);
                                    }
                                    obj.hosted = bill_arr;
                                }
                                else {
                                    obj.hosted = new Array();
                                }
                                if (result2.length != 0) {
                                    var bill_arr = new Array();
                                    for (var i = 0; i < result2.length; i++) {
                                        var bill_obj = new Object();
                                        bill_obj.bill_id = result2[i].bill_id;
                                        bill_obj.bill_name = result2[i].bill_name;
                                        bill_obj.bill_amount = result2[i].bill_amount;
                                        bill_obj.bill_tips = result2[i].bill_tips;
                                        bill_obj.bill_status = result2[i].bill_status;
                                        bill_obj.bill_image = result2[i].bill_image;
                                        bill_obj.invite_id = result2[i].invite_id;
                                        bill_obj.organiser_paypal_id = result2[i].organiser_paypal_id;
                                        var item = new Array();
                                        for (var k = 0; k < result4.length; k++) {
                                            if (result2[i].bill_id == result4[k].BILL_ID) {
                                                var item_obj = new Object();
                                                item_obj.item_name = result4[k].NAME;
                                                item_obj.item_price = result4[k].AMOUNT;
                                                item_obj.item_quantity = result4[k].QUANTITY;
                                                item.push(item_obj);
                                            }
                                        }
                                        bill_obj.items = item;
                                        bill_arr.push(bill_obj);
                                    }
                                    obj.attended = bill_arr;
                                }
                                else {
                                    obj.attended = new Array();
                                }
                                res.send({status: 1, message: '', content: obj});
                            });
                        }
                        else {
                            res.send({status: 0, message: 'Profile Does not Exist', content: ''});
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({
                                status: -1,
                                message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                content: ''
                            });
                        }
                        else {
                            res.send({status: -1, message: 'Invalid User', content: ''});
                        }
                    });
                }
            });
        });
    };

    this.UpdateBillDetails = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            var obj = new Object();
                            obj.BILL_ID = req.bill_id;
                            obj.TIPS = req.tips
                            obj.MODIFIED_DATE = new Date();
                            con.query('update t_bill set TIPS=? where BILL_ID=?', [obj.TIPS, obj.BILL_ID], function (err, result) {
                                if (err) {
                                    res.send({status: 0, message: 'Failed to Update the bill', content: ''});
                                }
                                else {
                                    res.send({status: 1, message: 'bill Updated Successfully', content: ''});
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({
                                        status: -1,
                                        message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                        content: ''
                                    });
                                }
                                else {
                                    res.send({status: -1, message: 'Invalid User', content: ''});
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    this.UpdateBillAndInviteMembers = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            var obj = new Object();
                            obj.BILL_ID = req.bill_id;
                            obj.TIPS = req.tips
                            obj.MODIFIED_DATE = new Date();
                            con.query('update t_bill set TIPS=? where BILL_ID=?', [obj.TIPS, obj.BILL_ID], function (err, result) {
                                if (err) {
                                    res.send({status: 0, message: 'Failed to save the bill', content: ''});
                                }
                                else {
                                    function doQuery1() {
                                        var defered = Q.defer();
                                        con.query("select USER_ID,PH_NUM from t_profile p inner join t_userbridge b on b.ID=p.BRIDGE_ID", defered.makeNodeResolver());
                                        return defered.promise;
                                    }

                                    Q.all([doQuery1()]).then(function (results) {
                                        var result1 = results[0][0];
                                        for (var i = 0; i < req.invitees.length; i++) {
                                            var userid = '';
                                            var obj = new Object();
                                            for (var j = 0; j < result1.length; j++) {
                                                if (req.invitees[i].contact_no.indexOf(result1[j].PH_NUM) > -1 || result1[j].PH_NUM.indexOf(req.invitees[i].contact_no) > -1) {
                                                    userid = result1[j].USER_ID;
                                                    break;
                                                }
                                            }
                                            var inv_obj = new Object();
                                            inv_obj.INVITE_ID = uuid.v1();
                                            inv_obj.BILL_ID = req.bill_id;
                                            inv_obj.USER_ID = userid;
                                            inv_obj.NAME = req.invitees[i].contact_name;
                                            inv_obj.PHONE_NUMBER = req.invitees[i].contact_no;
                                            inv_obj.PHOTO = req.invitees[i].contact_pic;
                                            inv_obj.AMOUNT = req.invitees[i].amount;
                                            inv_obj.INV_CODE = '123123';
                                            inv_obj.STATUS_ID = 1;
                                            inv_obj.CREATED_DATE = new Date();
                                            inv_obj.MODIFIED_DATE = new Date();
                                            con.query('insert into t_bill_invitation set ?', inv_obj, function (err, result) {
                                                if (err) {
                                                    res.send({
                                                        status: 0,
                                                        message: 'Failed to Update the bill',
                                                        content: ''
                                                    });
                                                }
                                                else {
                                                    res.send({
                                                        status: 1,
                                                        message: 'Bill Updated Sucessfully',
                                                        content: ''
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({
                                        status: -1,
                                        message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                        content: ''
                                    });
                                }
                                else {
                                    res.send({status: -1, message: 'Invalid User', content: ''});
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    this.InviteBillMembers = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            function doQuery1() {
                                var defered = Q.defer();
                                con.query("select USER_ID,PH_NUM from t_profile p inner join t_userbridge b on b.ID=p.BRIDGE_ID", defered.makeNodeResolver());
                                return defered.promise;
                            }

                            Q.all([doQuery1()]).then(function (results) {
                                var result1 = results[0][0];
                                for (var i = 0; i < req.invitees.length; i++) {
                                    var userid = '';
                                    var obj = new Object();
                                    for (var j = 0; j < result1.length; j++) {
                                        if (req.invitees[i].contact_no.indexOf(result1[j].PH_NUM) > -1 || result1[j].PH_NUM.indexOf(req.invitees[i].contact_no) > -1) {
                                            userid = result1[j].USER_ID;
                                            break;
                                        }
                                    }
                                    var inv_obj = new Object();
                                    inv_obj.INVITE_ID = uuid.v1();
                                    inv_obj.BILL_ID = req.bill_id;
                                    inv_obj.USER_ID = userid;
                                    inv_obj.NAME = req.invitees[i].contact_name;
                                    inv_obj.PHONE_NUMBER = req.invitees[i].contact_no;
                                    inv_obj.PHOTO = req.invitees[i].contact_pic;
                                    inv_obj.AMOUNT = req.invitees[i].amount;
                                    inv_obj.INV_CODE = '123123';
                                    inv_obj.STATUS_ID = 1;
                                    inv_obj.CREATED_DATE = new Date();
                                    inv_obj.MODIFIED_DATE = new Date();
                                    con.query('insert into t_bill_invitation set ?', inv_obj, function (err, result) {
                                        if (err) {
                                            res.send({status: 0, message: 'Failed to add members', content: ''});
                                        }
                                        else {
                                            res.send({status: 1, message: 'Members Added Sucessfully', content: ''});
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({
                                        status: -1,
                                        message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                        content: ''
                                    });
                                }
                                else {
                                    res.send({status: -1, message: 'Invalid User', content: ''});
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    this.Removebillinvites = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            con.query('delete from t_bill_invitation where INVITE_ID=?', [req.invite_id], function (err, result) {
                                if (err) {
                                    res.send({status: 0, message: 'Failed to remove member', content: ''});
                                }
                                else {
                                    res.send({status: 1, message: 'Member removed successfully', content: ''});
                                }
                            });
                        }
                        else {
                            res.send({status: 0, message: 'Profile Does not Exist', content: ''});
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({
                                status: -1,
                                message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                content: ''
                            });
                        }
                        else {
                            res.send({status: -1, message: 'Invalid User', content: ''});
                        }
                    });
                }
            });
        });
    };

    this.DeleteBill = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {

                            con.query('delete from t_billitems where bill_id=?', [req.bill_id], function (err, result) {
                                if (!err) {
                                    con.query('delete from t_bill_invitation where bill_id=?', [req.bill_id], function (err, result) {
                                        if (!err) {
                                            con.query('delete from t_bill where bill_id=?', [req.bill_id], function (err, result) {
                                                res.send({status: 1, message: 'bill deleted Sucessfull', content: ''});
                                            });
                                        }
                                        else {
                                            res.send({status: 1, message: 'bill deleted Sucessfull', content: ''});
                                        }
                                    });
                                }
                                else {
                                    res.send({status: 0, message: 'Profile Does not Exist', content: ''});
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({
                                        status: -1,
                                        message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                        content: ''
                                    });
                                }
                                else {
                                    res.send({status: -1, message: 'Invalid User', content: ''});
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    this.UpdateInvPayment = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            con.query('UPDATE t_bill_invitation SET STATUS_ID=2,PAYMENT_MODE=? WHERE t_bill_invitation.INVITE_ID=?', [req.payment_mode, req.invite_id], function (err, result) {
                                if (result.affectedRows > 0) {
                                    con.query('select USER_TOKEN from t_profile p inner join t_bill b on p.USER_ID=b.CREATER_ID inner join t_bill_invitation i on i.BILL_ID=b.BILL_ID where i.INVITE_ID=?', [req.invite_id], function (err, result) {
                                        if (result.length > 0) {
                                            sendnotification("Payment has been made by your invitee.", result[0].USER_TOKEN);
                                        }
                                        res.send({status: 1, message: 'Updated Sucessfully', content: ''});
                                    });
                                }
                                else {
                                    res.send({status: 0, message: 'Failed to update', content: ''});
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({
                                        status: -1,
                                        message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                        content: ''
                                    });
                                }
                                else {
                                    res.send({status: -1, message: 'Invalid User', content: ''});
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    this.UpdateOrgPayment = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            con.query("UPDATE t_bill_invitation SET STATUS_ID=1,PAYMENT_MODE=? WHERE INVITE_ID=?", [req.payment_mode, req.invite_id], function (err, result) {
                                if (result.affectedRows > 0) {
                                    console.log(req.invite_id);
                                    con.query('select USER_TOKEN,i.BILL_ID from t_profile p inner join t_bill_invitation i on p.USER_ID=i.USER_ID where i.INVITE_ID=?', [req.invite_id], function (err, result) {

                                        console.log(result.length);
                                        if (result.length > 0) {
                                            console.log(4);
                                            req.user_token = result[0].USER_TOKEN;
                                            req.bill_id = result[0].BILL_ID;
                                            if (req.status = 1) {
                                                con.query('update t_bill set STATUS_ID=1 where BILL_ID NOT IN (select BILL_ID from t_bill_invitation where BILL_ID=? and status_ID=0) and BILL_ID=?', [req.bill_id, req.bill_id], function (err, result) {
                                                    sendnotification("Your Payment has been accepted by the event organiser.", req.user_token);
                                                    res.send({status: 1, message: 'Updated Sucessfully', content: ''});
                                                });
                                            }
                                            else if (req.status = 0) {
                                                res.send({status: 1, message: 'Updated Sucessfully', content: ''});
                                                sendnotification("Your Payment has been rejected by the event organiser.", req.user_token);
                                            }
                                            else {
                                                res.send({status: 1, message: 'Updated Sucessfully', content: ''});
                                            }
                                        }
                                        else {
                                            con.query('select BILL_ID from  t_bill_invitation where INVITE_ID=?', [req.invite_id], function (err, result) {
                                                if (result.length > 0) {
                                                    con.query('update t_bill set STATUS_ID=1 where BILL_ID NOT IN (select BILL_ID from t_bill_invitation where BILL_ID=? and status_ID=0) and BILL_ID=?', [result[0].BILL_ID, result[0].BILL_ID], function (err, result) {

                                                        res.send({
                                                            status: 1,
                                                            message: 'Updated Sucessfully',
                                                            content: ''
                                                        });
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                                else {
                                    res.send({status: 0, message: 'Failed to update', content: ''});
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({
                                        status: -1,
                                        message: 'This Phone No. is registered with another mobile..Please Re-verify Again',
                                        content: ''
                                    });
                                }
                                else {
                                    res.send({status: -1, message: 'Invalid User', content: ''});
                                }
                            });
                        }
                    });
                }
            });
        });
    };
}

module.exports = new bill();
