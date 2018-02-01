util = require('util');
uuid = require('node-uuid');
path = require('path');
Yelp = require('yelp');
fs = require('fs');
Nexmo = require('simple-nexmo');
http = require('http');
request = require("request");
https = require("https");
url = require("url");
UTF8 = require('utf-8');
xml2js = require('xml2js');
Q = require('q');
async = require('async');
AWS = require('aws-sdk');

nexmo = new Nexmo({
    apiKey: '8d986cb5',
    apiSecret: 'a95fdc989dd87ade',
    useSSL: true,
    debug: false
});


_Routes = {
    user: require('../routes/users.routes'),
    login: require('../routes/login.routes'),
    bill: require('../routes/bill.routes'),
    contacts: require('../routes/contacts.routes')
};

GLOBAL.Admin_Id = '';
GLOBAL.Default_Item_Image = 'dinner.png';
GLOBAL.accessKeyId = 'AKIAINL5SGRTBOBY6OIA';
GLOBAL.secretAccessKey = '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';
GLOBAL.region = 'us-east-1';
GLOBAL.AWS_Images_Link='https://s3.amazonaws.com/vsplitbucket/';
GLOBAL.OCR_appid='VSplitApp';
GLOBAL.OCR_password='Di2Ip1Wyo0FZyhbkFLhRhe6X' //+QTrCg1iAaP9rYmVCzI47zev';


sendnotification = function(message,userARN) {
    AWS.config.update({
        accessKeyId: GLOBAL.accessKeyId,
        secretAccessKey: GLOBAL.secretAccessKey,
        region: GLOBAL.region
    });

    var sns = new AWS.SNS();
        var endpointArn = userARN;
        var payload = {
            "GCM": "{ \"data\": { \"message\": \"" + message + "\",\"title\": \"WeApp\" } }",
            "APNS_SANDBOX":"{\"aps\":{\"alert\":\"" + message + "\"}}"
        };
        payload.APNS = JSON.stringify(payload.APNS);
        payload = JSON.stringify(payload);
        sns.publish({
            Message: payload,
            MessageStructure: 'json',
            TargetArn: endpointArn
        }, function(err, data) {
        });
};


UploadFilesToS3 = function(image,FileName) {
    AWS.config.update({
        accessKeyId: GLOBAL.accessKeyId,
        secretAccessKey: GLOBAL.secretAccessKey,
        region: GLOBAL.region//'us-east-1'
    });
    var s3Bucket = new AWS.S3( { params: {Bucket: 'vsplitbucket'} } );
    buf = new Buffer(image.replace(/^data:image\/\w+;base64,/, ""),'base64'); //No_Image_Available.png
    var data = {
        Key: FileName,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
    };
    s3Bucket.putObject(data, function(err, data){
    });
};

// UploadFilesToS3 =(function (image,FileName) {
//     console.log('#########FileName');
// //    var file = image.originalname;
// //    var file_name = uuid()+file
// //    var size =  req.files['profileUrl'][0].size;
//     // console.log(file_name)
//  var stream = streamifier.createReadStream(image);
//     //  console.log(stream)

//   var  uploadImage =  blobSvc.createBlockBlobFromText(
//             'vsplitcontainer',
//              FileName,
//              stream,
//               {
//             contentType: 'image/jpeg',
//             contentEncoding: 'base64'
//             }, 
//             function(error, result, response){
//                 if(error){
//                     console.log("Couldn't upload stream");
//                     console.error(error);
//                 } else {
//                     console.log('Stream uploaded successfully');
//                     console.log(FileName)
//                 }
//         })
//         // return file_name;
// })