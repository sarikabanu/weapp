

function login() {
    this.validateotp = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select PH_NUM from t_verification WHERE OTP_CODE=? AND PH_NUM =? AND SYSDATE()-OTP_GEN_DATE<=600000', [req.oce, req.id], function (err, result) {
                if (result.length > 0) {
                    con.query('select ID from t_userbridge where PH_NUM=?', req.id, function (err, result) {
                        if (result.length == 0) {
                            var obj = new Object();
                            obj.ID = uuid.v1();
                            obj.PH_NUM = req.id;
                            obj.IMEI_NUMBER = req.imei;
                            obj.CREATED_DATE = new Date();
                            obj.MODIFIED_DATE = new Date();
                            con.query('insert into t_userbridge set ?', obj, function (err, result) {
                                if (err != null) {
                                    log_file.write(util.format(new Date(), 'insert into t_userbridge', err) + '\r\n');
                                }
                            });
                        }
                        else {
                            var obj = new Object();
                            obj.ID = result[0].ID;
                            obj.PH_NUM = req.id;
                            obj.IMEI_NUMBER = req.imei;
                            obj.CREATED_DATE = new Date();
                            obj.MODIFIED_DATE = new Date();
                            con.query('Update t_userbridge set IMEI_NUMBER=? where ID=?', [obj.IMEI_NUMBER,obj.ID], function (err, result) {
                                if (err != null) {
                                    log_file.write(util.format(new Date(), 'Update t_userbridge', err) + '\r\n');
                                }
                            });
                        }
                    });
                    res.send({ status: 1 , message: 'Verified Successfully' });
                    
                } else {
                    res.send({ status:0 , message: 'Verification Failed'});
                }
            });
        });
    };

    this.Generateotp = function (req, res) {
        connection.acquire(function (err, con) {
            var obj = new Object();
            obj.PH_NUM = req.id;
            obj.OTP_GEN_DATE = new Date();
            obj.OTP_CODE = randomIntInc(1000, 9999);
            con.query('insert into t_verification set ?', obj, function (err, result) {
                con.release();
                if (err) {
                    res.send({ status: 0, message: 'OTP sending failed' });
                    log_file.write(util.format(new Date(), 'Generate OTP', err) + '\r\n');
                } else {
                        var options = new Object();
                        if (String(obj.PH_NUM).length == 11) {
                            options.from = '14087131439';
                            options.to = obj.PH_NUM;
                        }
                        else {
                            options.from = 'WEAPPS';
                            options.to = obj.PH_NUM;
                        }
                        options.type = 'text';
                        options.text = 'WEAPP Code: '+obj.OTP_CODE+'. Valid for 15 minutes';
                    // nexmo.sendSMSMessage(options, callback);
                    //  res.send({ status: 1, message: 'OTP sent successfully'});
                        res.send({ status: 1, message: 'OTP sent successfully', oce:obj.OTP_CODE});
                }
            });
        });
    };

    this.verifyotp = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select PH_NUM from t_verification WHERE OTP_CODE=? AND PH_NUM =? AND SYSDATE()-OTP_GEN_DATE<=600000', [req.oce, req.id], function (err, result) {
                if (result.length > 0) {
                    con.query('select ID from t_userbridge where PH_NUM=?', req.id, function (err, result) {
                        if (result.length == 0) {
                            res.send({ status: 1 , message: 'Verified Successfully' });
                        }
                        else {
                            res.send({ status: 0 , message: 'This Phone No. is registered with another account. Please try with new one.' });
                        }
                    });
                }
                else {
                    res.send({ status:0 , message: 'Verification Failed'});
                }
            });
        });
    };

    this.sendotp = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID from t_userbridge where PH_NUM=?', req.id, function (err, result) {
                if (result.length>0) {
                    res.send({ status: 0, message: 'This Phone No. is registered with another account. Please try with new one.' });
                } else {
                    var obj = new Object();
                    obj.PH_NUM = req.id;
                    obj.OTP_GEN_DATE = new Date();
                    obj.OTP_CODE = randomIntInc(1000, 9999);
                    con.query('insert into t_verification set ?', obj, function (err, result) {
                        con.release();
                        if (err) {
                            res.send({ status: 0, message: 'OTP sending failed' });
                            log_file.write(util.format(new Date(), 'Generate OTP', err) + '\r\n');
                        } else {
                            var options = new Object();
                            if (String(obj.PH_NUM).length == 11) {
                                options.from = '14087131439';
                                options.to = obj.PH_NUM;
                            }
                            else {
                                options.from = 'WEAPPS';
                                options.to = obj.PH_NUM;
                            }
                            options.type = 'text';
                            options.text = 'WEAPP Code: '+obj.OTP_CODE+'. Valid for 15 minutes';
                            // nexmo.sendSMSMessage(options, callback);
                            //  res.send({ status: 1, message: 'OTP sent successfully'});
                            res.send({ status: 1, message: 'OTP sent successfully', oce:obj.OTP_CODE});
                        }
                    });
                }
            });
        });
    };
    
    function callback(err, response) {
        if (err) {
        }
    }

    function randomIntInc(low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }

}

module.exports = new login();
