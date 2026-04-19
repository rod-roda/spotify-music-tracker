import DefaultError from "./DefaultError";

export default class Unauthorized extends DefaultError {
    constructor(message = 'Missing authentication context') {
        super(message, 401);
    }
}
