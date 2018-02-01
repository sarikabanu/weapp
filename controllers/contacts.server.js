
function contacts() {
    this.CreateGroup = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            var obj = new Object();
                            obj.GROUP_ID = req.group_id = uuid.v1();
                            obj.USER_ID = result[0].USER_ID;
                            obj.GROUP_NAME = req.group_name;
                            obj.CREATED_DATE = new Date();
                            obj.MODIFIED_DATE = new Date();
                            con.query('select GROUP_ID from t_group where GROUP_NAME=? and USER_ID=?', [obj.GROUP_NAME, obj.USER_ID], function (err, result) {
                                if (result.length == 0) {
                                    con.query('insert into t_group set ?', obj, function (err, result) {
                                        if (err) {
                                            res.send({ status: 0 , message: 'Group Creation Failed', content: '' });
                                        }
                                        else {
                                            for (var i = 0; i < req.contacts.length; i++) {
                                                var obj = new Object();
                                                obj.ID = uuid.v1();
                                                obj.GROUP_ID = req.group_id;
                                                obj.CONTACT_NO = req.contacts[i].contact_no;
                                                obj.CONTACT_NAME = req.contacts[i].contact_name;
                                                obj.CONTACT_PIC = req.contacts[i].contact_pic;
                                                obj.CREATED_DATE = new Date();
                                                con.query('insert into t_map_group set ?', obj, function (err, result) {
                                                    if (err) {
                                                        res.send({ status: 0 , message: 'Failed to add', content: '' });
                                                        return;
                                                    }
                                                });
                                            }
                                            res.send({ status: 1 , message: 'Group Created Sucessfull', content: '' });
                                        }
                                    });
                                }
                                else {
                                    res.send({ status: 2 , message: 'Group Name Already Exist', content: '' });
                                }
                            });
                
                        }
                        else {
                            res.send({ status: 0, message: 'Profile Not Exist', content: '' });
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

    this.AddGroupContacts = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            for (var i = 0; i < req.contacts.length; i++) {
                                var obj = new Object();
                                obj.ID = uuid.v1();
                                obj.GROUP_ID = req.group_id;
                                obj.CONTACT_NO = req.contacts[i].contact_no;
                                obj.CONTACT_NAME = req.contacts[i].contact_name;
                                obj.CONTACT_PIC = req.contacts[i].contact_pic;
                                obj.CREATED_DATE = new Date();
                                con.query('insert into t_map_group set ?', obj, function (err, result) {
                                    if (err) {
                                        res.send({ status: 0 , message: 'Failed to add', content: '' });
                                        return;
                                    }
                                });
                            }
                            res.send({ status: 1 , message: 'Added Sucessfully', content: '' });
                        }
                        else {
                            res.send({ status: 0, message: 'Profile Not Exist', content: '' });
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

    this.DeleteGroup = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select USER_ID from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                        if (result.length > 0) {
                            con.query('delete from t_map_group where GROUP_ID=?', req.group_id, function (err, result) {
                                if (err) {
                                    res.send({ status: 0 , message: 'Failed to Delete Group', content: '' });
                                }
                                else {
                                    con.query('delete from t_group where GROUP_ID=?', req.group_id, function (err, result) {
                                        if (err) {
                                            res.send({ status: 0 , message: 'Failed to Delete Group', content: '' });
                                        }
                                        else {
                                            res.send({ status: 1 , message: 'Group Deleted Sucessfully', content: '' });
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            res.send({ status: 0, message: 'Profile Not Exist', content: '' });
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

    this.RemoveUserFromGroup = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            con.query('delete from t_map_group where GROUP_ID=? and CONTACT_NO=?', [req.group_id, req.contact_no], function (err, result) {
                                if (err) {
                                    res.send({ status: 0 , message: 'Failed to Delete Group', content: '' });
                                }
                                else {
                                    res.send({ status: 1 , message: 'Contact Removed Successfully', content: '' });
                                }
                            });
                        }
                        else {
                            res.send({ status: 0, message: 'Profile Not Exist', content: '' });
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

    this.GetGroupDetails = function (req, res) {
        connection.acquire(function (err, con) {
            con.query('select ID  from t_userbridge where PH_NUM=? AND IMEI_NUMBER=?', [req.id, req.imei], function (err, result) {
                if (result.length > 0) {
                    con.query('select p.USER_ID from t_profile p inner join t_userbridge b on p.BRIDGE_ID=b.ID where b.ID=?', [result[0].ID], function (err, result) {
                        if (result.length > 0) {
                            function doQuery1() {
                                var defered = Q.defer();
                                con.query("select ifnull(c.CONTACT_NO, '') as contact_no, ifnull(c.CONTACT_NAME, '') as contact_name, ifnull(c.CONTACT_PIC, '') as contact_pic, ifnull(c.GROUP_ID, '') as group_id from t_map_group c", defered.makeNodeResolver());
                                return defered.promise;
                            }
                            
                            function doQuery2() {
                                var defered = Q.defer();
                                con.query('SELECT * from t_group', defered.makeNodeResolver());
                                return defered.promise;
                            }
                            
                            Q.all([doQuery1(), doQuery2()]).then(function (results) {
                                var result1 = results[0][0];
                                var result2 = results[1][0];
                                var Details_Arr = new Array();
                                for (var i = 0; i < result2.length; i++) {
                                    var grpobj = new Object();
                                    var arr = new Array();
                                    grpobj.Group_id = result2[i].GROUP_ID;
                                    grpobj.Group_name = result2[i].GROUP_NAME;
                                    for (var j = 0; j < result1.length; j++) {
                                        if (result1[j].group_id == result2[i].GROUP_ID) {
                                            var contactobj = new Object();
                                            contactobj.contact_name = result1[j].contact_name;
                                            contactobj.contact_no = result1[j].contact_no;
                                            contactobj.contact_pic = result1[j].contact_pic;
                                            arr.push(contactobj);
                                        }
                                    }
                                    grpobj.Contacts = arr;
                                    Details_Arr.push(grpobj);
                                }
                                res.send({ status: 1, message: '', content: Details_Arr });
                            });
                        } 
                        else {
                            res.send({ status: 0, message: 'Profile Not Exist', content: '' });
                            if (err != null) {
                                log_file.write(util.format(new Date(), 'Get Group Details', err) + '\r\n');
                            }
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
    }
}

module.exports = new contacts();