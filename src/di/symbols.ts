export const DIKey = {
    EXPRESS_SERVICE: Symbol("express router"),

    HANDLER: Symbol("handler"),
    ORM_CONNECTION: Symbol("orm connection"),
    REPOSITORY: Symbol("repository"),
    ROUTER: Symbol("router")
};

export const DITag = {
    EXPRESS_ROUTER: Symbol("express router"),

    SERVICE_ADD_CREDENTIAL: Symbol("add credential"),
    SERVICE_AUTHORIZE: Symbol("authorize"),
    SERVICE_FETCH_ALL: Symbol("fetch all"),
    SERVICE_IS_AUTHORIZED: Symbol("is authorized"),
    SERVICE_LOGOUT: Symbol("logout"),
    SERVICE_MAIL_CONFIRMATION: Symbol("mail confirmation"),
    SERVICE_MAIL_VERIFICATION: Symbol("mail verification"),
    SERVICE_SEND_ON_AUTH: Symbol("send on authorized"),
    SERVICE_UPDATE_CREDENTIAL: Symbol("verify and update credential")
};


