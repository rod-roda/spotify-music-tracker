import DefaultError from "./DefaultError";

export default class Unauthorized extends DefaultError {
    constructor(message = 'Contexto de autenticação ausente') {
        super(message, 401);
    }
}
