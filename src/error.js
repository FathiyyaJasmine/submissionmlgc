class ClientIssue extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ClientIssue';
    }
  }
  
  class InputIssue extends ClientIssue {
    constructor(message) {
        super(message);
        this.name = 'InputIssue';
    }
  }
  
  module.exports = { ClientIssue, InputIssue };