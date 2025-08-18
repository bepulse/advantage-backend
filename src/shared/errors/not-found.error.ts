import HttpError from "./http.error";

export default class NotFoundError extends HttpError {
    constructor(message = "Resource not found") {
        super(404, message);
    }
}