import DefaultError from "./DefaultError";

export default class BadRequest extends DefaultError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}
