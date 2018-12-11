"use strict"

class BaseError extends Error {
    constructor(code, message, status) {
        super();
        Error.captureStackTrace(this, this.constructor);

        this.name = this.constructor.name;
        this.code = code;
        this.message = message || 'Something went wrong. Please try again.';
        this.status = status || 500;
    }
}

class UnknownError extends BaseError {
    constructor(message) {
        super(0, message || 'Unknown Error.', 520);
    }
}
exports.UnknownError = UnknownError;

class NotExistError extends BaseError {
    constructor(message) {
        super(1, message || 'Data not exist.', 204);
    }
}
exports.NotExistError = NotExistError;

class DuplicatedError extends BaseError {
    constructor(message) {
        super(2, message || 'Data duplicated.', 403);
    }
}
exports.DuplicatedError = DuplicatedError;

class WeChatResError extends BaseError {
    constructor(message) {
        super(3, message || 'Response error from WeChat.', 500);
    }
}
exports.WeChatResError = WeChatResError;

class NotLoggedInError extends BaseError {
    constructor(message) {
        super(4, message || 'Need login.', 401);
    }
}
exports.NotLoggedInError = NotLoggedInError;

class RedisError extends BaseError {
    constructor(message) {
        super(5, message || 'Error from redis.', 500);
    }
}
exports.RedisError = RedisError;

class TypeError extends BaseError {
    constructor(message) {
        super(6, message || 'Type is wrong.', 500);
    }
}
exports.TypeError = TypeError;

class KeyError extends BaseError {
    constructor(message) {
        super(7, message || 'Key not exist.', 500);
    }
}
exports.KeyError = KeyError;

class FileOpError extends BaseError {
    constructor(message) {
        super(8, message || 'File operation error.', 500);
    }
}
exports.FileOpError = FileOpError;
