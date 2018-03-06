class User {
    get user() {
        return {
            customer: window.cwcCustomerId || this._customer || 'studiopool',
            token: window.cwcBearerToken || this._bearerToken
        };
    };
    
    get _bearerToken() {
        // TODO: fetch bearer token from API
    }
    
    get _customer () {
        // TODO: fetch customer id from API
    }
}

const user = new User();

export default user;