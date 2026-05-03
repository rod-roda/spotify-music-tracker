import DefaultError from "./DefaultError";

export default class BadRequest extends DefaultError {
    constructor(message = 'Requisição inválida') {
        super(message, 400);
    }
}
