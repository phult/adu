/**
 * @author Phuluong
 * Jan 11, 2016
 */
module.exports = new SessionManager();
var path = require('../../bootstrap/paths');
var util = require('../../core/util');
function SessionManager() {
    this.SESSION_ID_KEY = "adu_session_id";
    this.sessions = {};
    var driver = null;
    this.start = function (config) {
        driver = new (require("../.." + path["session-drivers"] + "/" + config.driver))(config);
    };
    this.initHTTPSession = function (request, response) {
        var retval = {
            type: "http"
        };
        // get cookies
        var cookies = {};
        if (request.headers != null && request.headers.cookie != null) {
            request.headers.cookie.split(";").forEach(function (cookie) {
                var parts = cookie.split("=");
                cookies[parts[0].trim()] = (parts[1] || "").trim();
            });
        }
        // existed session
        if (cookies[this.SESSION_ID_KEY] != null && this.sessions[cookies[this.SESSION_ID_KEY]] != null) {
            retval = this.sessions[cookies[this.SESSION_ID_KEY]];
            if (retval != null) {
                retval.cookies = cookies;
            }
        }
        // init new session
        else {
            var sessionId = util.randomString();
            retval.id = sessionId;
            retval.cookies = cookies;
            var self = this;
            retval.get = function (key, value, defaultValue) {
                return driver.get(retval.id, key, value, defaultValue);
            };
            retval.set = function (key, value) {
                return driver.set(retval.id, key, value);
            };
            // add to sessions
            this.sessions[sessionId] = retval;
            // set cookie value
            var writeHead = response.writeHead;
            response.writeHead = function (statusCode) {
                var reasonPhrase = '', headers = {};
                if (2 == arguments.length) {
                    if ('string' == typeof arguments[1]) {
                        reasonPhrase = arguments[1];
                    } else {
                        headers = arguments[1];
                    }
                } else if (3 == arguments.length) {
                    reasonPhrase = arguments[1];
                    headers = arguments[2];
                }
                headers['Set-Cookie'] = self.SESSION_ID_KEY + '=' + sessionId;
                writeHead.apply(response, [statusCode, reasonPhrase, headers]);
            };
        }
        return retval;
    };
    this.initSocketIOSession = function (socket) {
        var retval = {
            type: "socketIO"
        };
        var userId = socket.handshake.query.userId;
        retval.id = socket.id;
        retval.userId = userId;
        retval.socket = socket;
        if (socket.handshake.query.extra != null) {
            var params = socket.handshake.query.extra.split(",");
            params.forEach(function (param) {
                retval[param] = socket.handshake.query[param];
            });
        }
        // add to sessions
        this.sessions[socket.id] = retval;
        return retval;
    };
    this.destroy = function (session) {
        var retval = false;
        if (session != null && session.id != null) {
            delete this.sessions[session.id];
            retval = true;
        }
        return retval;
    };
    /**
     * Get all socketio users
     * @returns {Array}
     */
    this.getUsers = function () {
        var retval = [];
        for (var i = 0; i < this.sessions.length; i++) {
            if (sessions[i].userId == null) {
                continue;
            }
            var existedUser = false;
            for (var j = 0; j < retval.length; j++) {
                if (retval[j].userId == null) {
                    continue;
                }
                if (retval[j].userId == this.sessions[i].userId) {
                    existedUser = true;
                    break;
                }
            }
            if (!existedUser) {
                retval.push(this.sessions[i]);
            }
        }
        return retval;
    };
    /**
     * Get session by userId
     * @param {int|String} userId
     * @returns {Array}
     */
    this.getUserSessions = function (userId) {
        var reval = [];
        for (var i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].userId == userId) {
                reval.push(this.sessions[i]);
            }
        }
        return reval;
    };
    /**
     * Get sessions by type
     * @returns {Array}
     */
    this.getSessions = function (type) {
        var retval = [];
        switch (type) {
            case "http":
            {
                for (var sessionId in this.sessions) {
                    if (this.sessions[sessionId].type == "http") {
                        retval.push(this.sessions[sessionId]);
                    }
                }
                break;
            }
            case "socketIO":
            {
                for (var sessionId in this.sessions) {
                    if (this.sessions[sessionId].type == "socketIO") {
                        retval.push(this.sessions[sessionId]);
                    }
                }
                break;
            }
            default :
            {
                for (var sessionId in this.sessions) {
                    retval.push(this.sessions[sessionId]);
                }
                retval = this.sessions;
            }
        }
        return retval;
    };
    /**
     * Get session by io socket
     * @returns {Session}
     */
    this.getSessionBySocket = function (socket) {
        var retval = null;
        for (var sessionId in this.sessions) {
            if (this.sessions[sessionId].socket == socket) {
                retval = this.sessions[sessionId];
                break;
            }
        }
        return retval;
    };
}