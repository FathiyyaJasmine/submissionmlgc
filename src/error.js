// Error handling class for client-related errors
class ClientIssue extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ClientIssue';
    }
  }
  
  // Subclass of ClientIssue for input-related errors
  class InputIssue extends ClientIssue {
    constructor(message) {
        super(message);
        this.name = 'InputIssue';
    }
  }
  
  module.exports = { ClientIssue, InputIssue };