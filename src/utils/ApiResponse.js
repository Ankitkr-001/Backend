// For Api response handeling How the Eroor should come

class ApiResponse {
    constructor(
        statusCode,
        message,
        data = null,

    ) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400
    }
}

export { ApiResponse }