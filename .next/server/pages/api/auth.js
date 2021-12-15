"use strict";
(() => {
var exports = {};
exports.id = 508;
exports.ids = [508];
exports.modules = {

/***/ 8728:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

;// CONCATENATED MODULE: external "@arcana/auth"
const auth_namespaceObject = require("@arcana/auth");
;// CONCATENATED MODULE: external "ethers"
const external_ethers_namespaceObject = require("ethers");
;// CONCATENATED MODULE: ./pages/api/auth.js


const authInstance = new auth_namespaceObject.AuthProvider({
    appID: 249,
    network: "testnet",
    oauthCreds: [
        {
            type: "google",
            clientId: "1005758455282-o1vm35uheafa77mne3go8cckj5ps9bui.apps.googleusercontent.com"
        }, 
    ],
    redirectUri: `/`
});
function padPublicKey(publicKey) {
    return "0x04" + publicKey.X.padStart(64, "0") + publicKey.Y.padStart(64, "0");
}
function LoggedIn() {
    // AUTH-2: Check if the user is already logged in.
    return authInstance.isLoggedIn();
}
async function signInUser() {
    // AUTH-3: Sign in a user.
    if (!LoggedIn()) {
        // AUTH-3a: If user does not have an active session,
        // trigger the Google authentication process.
        await authInstance.loginWithSocial("google");
    }
}
function handleRedirect() {
    // AUTH-4: Handle auth flow on the redirect page.
    AuthProvider.handleRedirectPage("/");
}
function fetchUserData() {
    const { userInfo , privateKey  } = authInstance.getUserInfo();
    const details = {
        email: userInfo.id,
        profileImage: userInfo.picture,
        givenName: userInfo.name
    };
    return details;
}
async function fetchWalletInfo() {
    const userInfo = fetchUserData();
    const publicKey = await authInstance.getPublicKey({
        verifier: "google",
        id: userInfo.email
    });
    const actualPublicKey = padPublicKey(publicKey);
    const wallet = new Wallet(privateKey);
    const cryptoDetails = {
        walletAddress: wallet.address,
        privateKey: privateKey,
        publicKey: actualPublicKey
    };
    return cryptoDetails;
}
function logout() {
    // AUTH-5: Log a user out.
    authInstance.logout();
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(8728));
module.exports = __webpack_exports__;

})();