

AWS.config.update({
    accessKeyId: 'AKIAICTRXDOYFYRUG53A',
    secretAccessKey: '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',
    region: 'ap-south-1'
});

var sns = new AWS.SNS();

sns.createPlatformEndpoint({
    PlatformApplicationArn: 'arn:aws:sns:us-west-2:155191961595:app/GCM/Weapp',
    Token: '{DEVICE_TOKEN}'
}, function(err, data) {
    if (err) {
        console.log(err.stack);
        return;
    }

    var endpointArn = data.EndpointArn;

    var payload = {
        default: 'Hello World',
        APNS: {
            aps: {
                alert: 'Hello World',
                sound: 'default',
                badge: 1
            }
        }
    };

    // first have to stringify the inner APNS object...
    payload.APNS = JSON.stringify(payload.APNS);
    // then have to stringify the entire message payload
    payload = JSON.stringify(payload);

    console.log('sending push');
    sns.publish({
        Message: payload,
        MessageStructure: 'json',
        TargetArn: endpointArn
    }, function(err, data) {
        if (err) {
            console.log(err.stack);
            return;
        }

        console.log('push sent');
        console.log(data);
    });
});