import DefaultError from "./DefaultError";

export default class BadGateway extends DefaultError {
    constructor(message = 'Bad gateway') {
        super(message, 502);
    }
}
