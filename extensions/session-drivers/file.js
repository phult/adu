/**
 * @author Phuluong
 * Jan 11, 2016
 */
module.exports = File;
var Driver = require(__base + "/core/session/driver");
var fs = require("fs");
var util = require(__base + '/core/util');
function File(config) {
    var sessionStorage = config.storage;
    if (!fs.existsSync(sessionStorage)) {
        fs.mkdirSync(sessionStorage, 0777);
    }
    this.get = function (sessionId, key, defaultValue) {
        var retval = defaultValue;
        key = key.hash();
        try {
            retval = fs.readFileSync(sessionStorage + "/" + sessionId + "/" + key, "utf8");
            retval = JSON.parse(retval);
        } catch (e) {
        }
        return retval;
    };
    this.set = function (sessionId, key, value) {
        var retval = true;
        key = key.hash();
        if (!(typeof value === "string")) {
            value = JSON.stringify(value);
        }
        try {
            if (!fs.existsSync(sessionStorage + "/" + sessionId)) {
                fs.mkdirSync(sessionStorage + "/" + sessionId, 0777);
            }
            fs.writeFileSync(sessionStorage + "/" + sessionId + "/" + key, value);
        } catch (e) {
            retval = false;
        }
        return retval;
    };
    this.getSessions = function () {
        var sessions = {};
        fs.readdirSync(sessionStorage).forEach(function (sessionDir) {
            var sessionPath = sessionStorage + "/" + sessionDir;
            if (fs.lstatSync(sessionPath).isDirectory()) {
                sessions[sessionDir] = {id: sessionDir};
                // Get value of session key
                /*fs.readdirSync(sessionPath).forEach(function (sessionDataFile) {
                 var sessionDataPath = sessionStorage + "/" + sessionDir + "/" + sessionDataFile;
                 if (!fs.lstatSync(sessionDataPath).isDirectory()) {
                 var value = fs.readFileSync(sessionDataPath, 'utf8');
                 }
                 });*/
            }
        });
        return sessions;
    };
    this.destroy = function (sessionId) {
        util.deleteDirectory(sessionStorage + "/" + sessionId);
    };
}
File.prototype = new Driver();
