class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }


/*
1. The ApiResponse class is a utility designed to standardize and simplify the structure of API responses in a Node.js application.

*/