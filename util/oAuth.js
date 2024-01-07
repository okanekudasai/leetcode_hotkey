const oAuth2 = {
    init() {
        this.ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
        this.AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';
        this.CLIENT_ID = '26139f667012e408eea6';
        this.REDIRECT_URL = 'https://github.com/';
    },
    begin() {
        this.init();

        let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri=${this.REDIRECT_URL}&scope=repo`;

        chrome.tabs.create({ url, selected: true })
    },
}