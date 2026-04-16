import DefaultError from "./DefaultError";

export default class NotFound extends DefaultError {
    constructor(message = 'Not found') {
        super(message, 404);
    }
}
