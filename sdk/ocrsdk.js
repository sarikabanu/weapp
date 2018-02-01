
exports.create = function(applicationId, password) {
	return new ocrsdk(applicationId, password);
}

exports.ProcessingSettings = ProcessingSettings;

function ocrsdk(applicationId, password) {
	this.appId = applicationId;
	this.password = password;
	this.serverUrl = "http://cloud.ocrsdk.com";
}

function ProcessingSettings() {
	this.language = "English"; 
	this.exportFormat = "txt"; 
	this.customOptions = ''; 
}

ocrsdk.prototype.processImage = function(filePath, settings, userCallback) {

	if (settings == null) {
		settings = new ProcessingSettings();
	}

	var urlOptions = settings.asUrlParams();
	var req = this._createTaskRequest('POST', '/processImage' + urlOptions,userCallback);

    var fileContents = filePath;
	req.write(fileContents);
	req.end();
}

ocrsdk.prototype.getTaskStatus = function(taskId, userCallback) {
	var req = this._createTaskRequest('GET', '/getTaskStatus?taskId=' + taskId,userCallback);
	req.end();
}

ocrsdk.prototype.isTaskActive = function(taskData) {
	if (taskData.status == 'Queued' || taskData.status == 'InProgress') {
		return true;
	}
	return false;
}

ocrsdk.prototype.waitForCompletion = function(taskId, userCallback) {
	if (taskId.indexOf('00000000') > -1) {
		// A null Guid passed here usually means a logical error in the calling code
		userCallback(new Error('Null id passed'), null);
		return;
	}
	var recognizer = this;
	var waitTimeout = 0000;

	function waitFunction() {
		recognizer.getTaskStatus(taskId,
			function(error, taskData) {
				if (error) {
					userCallback(error, null);
					return;
            }

				if (recognizer.isTaskActive(taskData)) {
					setTimeout(waitFunction, waitTimeout);
				} else {

					userCallback(null, taskData);
				}
			});
	}
	setTimeout(waitFunction, waitTimeout);
}

ocrsdk.prototype.downloadResult = function(resultUrl,userCallback) {
	var parsed = url.parse(resultUrl);

	var req = https.request(parsed, function(response) {
		response.on('data', function(data) {
            var abc = UTF8.getStringFromBytes(data);
            userCallback(abc)
		});
	});

	req.on('error', function(e) {
		userCallback(error);
	});

	req.end();

}

ocrsdk.prototype._createTaskRequest = function(method, urlPath,taskDataCallback) {
	function parseXmlResponse(data) {
		var response = new Object();

		var parser = new xml2js.Parser({
			explicitCharKey : false,
			trim : true,
			explicitRoot : true,
			mergeAttrs : true
		});
		parser.parseString(data, function(err, objResult) {
			if (err) {
				taskDataCallback(err, null);
				return;
			}

			response = objResult;
		});

		if (response == null) {
			return;
		}

		if (response.response == null || response.response.task == null
				|| response.response.task[0] == null) {
			if (response.error != null) {
				taskDataCallback(new Error(response.error.message), null);
			} else {
				taskDataCallback(new Error("Unknown server resonse"), null);
			}

			return;
		}

		var task = response.response.task[0];

		taskDataCallback(null, task);
	}

	function getServerResponse(res) {
		res.setEncoding('utf8');
		res.on('data', parseXmlResponse);
	}

	var requestOptions = url.parse(this.serverUrl + urlPath);
	requestOptions.auth = this.appId + ":" + this.password;
	requestOptions.method = method;
	requestOptions.headers = {
		'User-Agent' : "node.js client library"
	};

	var req = null;
	if (requestOptions.protocol == 'http:') {
		req = http.request(requestOptions, getServerResponse);
	} else {
		req = https.request(requestOptions, getServerResponse);
	}

	req.on('error', function(e) {
		taskDataCallback(e, null);
	});

	return req;
}

ProcessingSettings.prototype.asUrlParams = function() {
	var result = '';

	if (this.language.length != null) {
		result = '?language=' + this.language;
	} else {
		result = '?language=English';
	}

	if (this.exportFormat.length != null) {
		result += '&exportFormat=' + this.exportFormat;
	} else {
		result += "&exportFormat=txt"
	}

	if (this.customOptions.length != 0) {
		result += '?' + this.customOptions;
	}

	return result;
}
