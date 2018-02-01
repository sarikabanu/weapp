
function Profile() {
    
    this.CreateProfile = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    req.bridge_id = result[0].ID;
                    con.query('select USER_ID from t_profile where BRIDGE_ID=?', [result[0].ID], function (err, result) {
                        if (result.length == 0) {
                            var FileName = uuid.v1() +'.jpg';
                            UploadFilesToS3(req.profile_pic,FileName);

                            var obj = new Object();
                            obj.USER_ID = uuid.v1();
                            obj.BRIDGE_ID = req.bridge_id;
                            obj.NAME = req.name;
                            obj.NICK_NAME = req.nick_name;
                            obj.EMAIL_ID = req.email_id;
                            obj.PROFILE_PIC = FileName;
                            obj.DOB = req.dob;
                            obj.GENDER = req.gender;
                            obj.MARRIED_STATUS = req.married_status;
                            obj.MODIFIED_DATE = new Date();
                            obj.ADDRESS = req.address;
                            obj.USER_TOKEN='';
                            obj.PAYPAL_ID='';
                            obj.CREATED_DATE = new Date();
                            con.query('insert into t_profile set ?', obj, function (err, result) {

                            });
                            res.send({ status: 1, message: 'Profile Created Successfully', content: '' });
                        } 
                        else {
                            res.send({ status: 0, message: 'Profile Already Created', content: '' });

                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };
    
    this.GetProfileDetails = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.NAME as name,p.DOB as dob,p.GENDER as gender,p.EMAIL_ID as email_id,Concat("' + GLOBAL.AWS_Images_Link + '",p.PROFILE_PIC) as profile_pic,p.NICK_NAME as nick_name,p.MARRIED_STATUS as married_status,p.ADDRESS as address,p.CREATED_DATE as joined_date,p.PAYPAL_ID as paypal_id from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.PH_NUM=? AND b.IMEI_NUMBER=? ', [req.id, req.imei], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: 1, message: '', content: result });
                        }
                        else {
                            res.send({ status: 2, message: 'Profile Not Created', content: '' });

                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };
    
    this.UpdateProfile = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            var obj = new Object();
                            obj.USER_ID = result[0].USER_ID;
                            obj.DOB = req.dob;
                            obj.NAME = req.name;
                            obj.NICK_NAME = req.nick_name;
                            obj.EMAIL_ID = req.email_id;
                            obj.GENDER = req.gender;
                            obj.MARRIED_STATUS = req.married_status;
                            obj.MODIFIED_DATE = new Date();
                            obj.ADDRESS = req.address;
                            obj.CREATED_DATE = new Date();
                            con.query('UPDATE t_profile SET NAME=?, DOB=?, GENDER=?, MARRIED_STATUS=?, ADDRESS=?, MODIFIED_DATE=?,NICK_NAME=?,EMAIL_ID=?  WHERE USER_ID = ?', [obj.NAME, obj.DOB, obj.GENDER, obj.MARRIED_STATUS, obj.ADDRESS, obj.MODIFIED_DATE, obj.NICK_NAME, obj.EMAIL_ID, obj.USER_ID], function (err, result) {
                                con.release();
                                if (err) {
                                    res.send({ status: 0, message: 'Profile Updation Failed', content: '' });
                                }
                                else {
                                    res.send({ status: 1, message: 'Profile Updated Successfull', content: '' });
                                }
                            });
                        } 
                        else {
                            res.send({ status: 0, message: 'Profile Not Created',content:'' });
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };
    
    this.UpdateProfilePic = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            var FileName = uuid.v1() +'.jpg';
                            UploadFilesToS3(req.profile_pic,FileName);
                            var obj = new Object();
                            obj.USER_ID = result[0].USER_ID;
                            obj.PROFILE_PIC = FileName;
                            obj.MODIFIED_DATE = new Date();
                            con.query('Update t_profile set PROFILE_PIC=?,MODIFIED_DATE=? where USER_ID=?', [obj.PROFILE_PIC, obj.MODIFIED_DATE, obj.USER_ID], function (err, result) {
                                con.release();
                                if (err) {
                                    res.send({ status: 0, message: 'Profile Pic Updation Failed', content: '' });
                                } else {
                                    res.send({ status: 1, message: 'Profile Pic Updated Successfull', content: '' });
                                }
                            });
                        } 
                        else {
                            res.send({ status: 0, message: 'Profile Does not Created', content: '' });
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };

    this.GetUserDetails = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            function doQuery1() {
                                var defered = Q.defer();
                                con.query('select p.NAME as name,p.DOB as dob,p.GENDER as gender,p.EMAIL_ID as email_id,Concat("' + GLOBAL.AWS_Images_Link + '",p.PROFILE_PIC) as profile_pic,p.NICK_NAME as nick_name,p.MARRIED_STATUS as married_status,p.ADDRESS as address,(select count(e.EVENT_ID) from t_event e where e.CREATER_ID=p.user_id) as myevent_count,(select count(e.EVENT_ID) from t_event e inner join t_event_invitation i on i.EVENT_ID=e.EVENT_ID  where i.USER_ID=p.user_id) as myinvite_count,p.CREATED_DATE as joined_date,p.PAYPAL_ID as paypal_id from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.PH_NUM=? AND b.IMEI_NUMBER=? ', [req.id, req.imei], defered.makeNodeResolver());
                                return defered.promise;
                            }
                            
                            function doQuery2() {
                                var defered = Q.defer();
                                con.query('select NAME as name,CATEGORY_ID as category_id from t_category', defered.makeNodeResolver());
                                return defered.promise;
                            }
                            
                            function doQuery3() {
                                var defered = Q.defer();
                                con.query('select i.ITEMS_ID as items_id,i.NAME as item_name,CONCAT("' + GLOBAL.AWS_Images_Link + '", i.IMAGE_URL) as image_url,c.NAME as category_name,i.CATEGORY_ID as category_id,(case 1 when (select count(*) from t_userpreference t where i.ITEMS_ID=t.ITEMS_ID and i.CATEGORY_ID=t.CATEGORY_ID and t.USER_ID=?) then 1 else 0 end) as IsUserPreference from t_items i inner join  t_category c on c.CATEGORY_ID=i.CATEGORY_ID where i.CREATER_ID="' + GLOBAL.Admin_Id + '" || i.CREATER_ID=?', [result[0].USER_ID, result[0].USER_ID], defered.makeNodeResolver());
                                return defered.promise;
                            }
                            
                            Q.all([doQuery1(), doQuery2(), doQuery3()]).done(function (results) {
                                var result1 = results[0][0];
                                var result2 = results[1][0];
                                var result3 = results[2][0];
                                if (result1.length != 0) {
                                    var obj = new Object();
                                    obj.basic_details = result1;
                                    var preference_arr = new Array();
                                    for (var i = 0; i < result2.length; i++) {
                                        var categoryobj = new Object();
                                        categoryobj.category_id = result2[i].category_id;
                                        categoryobj.category_name = result2[i].name;
                                        var itemarr = new Array();
                                        for (var j = 0; j < result3.length; j++) {
                                            var itemobj = new Object();
                                            if (result2[i].category_id == result3[j].category_id) {
                                                itemobj.item_id = result3[j].items_id;
                                                itemobj.item_name = result3[j].item_name;
                                                itemobj.image_url = result3[j].image_url;
                                                itemobj.isuserpreference = result3[j].IsUserPreference;
                                                itemarr.push(itemobj);
                                            }
                                        }
                                        categoryobj.items = itemarr;
                                        preference_arr.push(categoryobj);
                                    }
                                    obj.Preferences = preference_arr;
                                    res.send({ status: 1, message: '', content: obj });
                                }
                                else {
                                    res.send({ status: 2, message: 'Profile Not Created', content: '' });
                                }
                            });
                        }
                        else {
                            res.send({ status: 2, message: 'Profile Does not Exist', content: '' });
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
            
        });
    };

    this.UpdatePhoneNo = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    req.user_id=result[0].ID;
                    con.query('select PH_NUM from t_verification WHERE OTP_CODE=? AND PH_NUM =? AND SYSDATE()-OTP_GEN_DATE<=600000', [req.oce, req.ph_num], function (err, result) {
                        if (result.length > 0) {
                            con.query('update t_userbridge set PH_NUM=? where ID=?', [req.ph_num, req.user_id ], function (err, result) {
                                con.release();
                                if (result.affectedRows>0) {
                                    res.send({ status: 1, message: 'Phone No. Updated Successfull', content: '' });
                                } else {
                                    res.send({ status: 0, message: 'Failed to Update Phone No.', content: '' });
                                }
                            });

                        } else {
                            res.send({ status:0 , message: 'Verification Failed'});
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };

    this.Updatetoken = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('update t_profile set USER_TOKEN=? where BRIDGE_ID=?', [req.token, result[0].ID ], function (err, result) {
                        if (result.affectedRows>0) {
                            res.send({ status: 1, message: 'Token Updated Successfull', content: '' });
                        } else {
                            res.send({ status: 0, message: 'Failed to update Token', content: '' });
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };

    this.Updatepaypal = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('update t_profile set PAYPAL_ID=? where BRIDGE_ID=?', [req.paypal_id, result[0].ID ], function (err, result) {
                        if (result.affectedRows>0) {
                            res.send({ status: 1, message: 'Token Updated Successfull', content: '' });
                        } else {
                            res.send({ status: 0, message: 'Failed to update Token', content: '' });
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };

    this.Reportaproblem = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            var FileName = uuid.v1() +'.jpg';
                            UploadFilesToS3(req.picture,FileName);
                            
                            var obj = new Object();
                            obj.ID = uuid.v1();
                            obj.TYPE = req.type;
                            obj.DESCRIPTION = req.description;
                            obj.PICTURE_URL = FileName;
                            obj.USER_ID = result[0].USER_ID;
                            obj.STATUS = '0';
                            obj.CREATED_DATE = new Date();
                            con.query('insert into t_Problems_Report set ?', obj, function (err, result) {
                                if (err) {
                                    res.send({ status: 0 , message: 'Reporting Failed', content: '' });
                                }
                                else {
                                    res.send({ status: 1 , message: 'Reported Successfully', content: '' });
                                }
                            });
                        }
                        else {
                            con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                                if (result.length > 0) {
                                    res.send({ status: 3, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                                }
                                else {
                                    res.send({ status: 0, message: 'Invalid User', content: '' });
                                }
                            });
                        }
                    });
                }
                else {
                    con.query('select *  from t_userbridge where PH_NUM=?', [req.id], function (err, result) {
                        if (result.length > 0) {
                            res.send({ status: -1, message: 'This Phone No. is registered with another mobile..Please Re-verify Again', content: '' });
                        }
                        else {
                            res.send({ status: -1, message: 'Invalid User', content: '' });
                        }
                    });
                }
            });
        });
    };
}


module.exports = new Profile();