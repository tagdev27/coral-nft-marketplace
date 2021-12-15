import { AuthProvider } from "@arcana/auth";
import { Wallet } from "ethers";


const authInstance = new AuthProvider({
    appID: 249,
    network: "testnet",
    oauthCreds: [
        {
            type: "google",
            clientId: "1005758455282-o1vm35uheafa77mne3go8cckj5ps9bui.apps.googleusercontent.com",
        },
    ],
    redirectUri: `/`,
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
    const { userInfo, privateKey } = authInstance.getUserInfo();
    const details = {
        email: userInfo.id,
        profileImage: userInfo.picture,
        givenName: userInfo.name,
    }
    return details
}

async function fetchWalletInfo() {
    const userInfo = fetchUserData()
    const publicKey = await authInstance.getPublicKey({
        verifier: "google",
        id: userInfo.email,
    });
    const actualPublicKey = padPublicKey(publicKey);
    const wallet = new Wallet(privateKey);
    const cryptoDetails = {
        walletAddress: wallet.address,
        privateKey: privateKey,
        publicKey: actualPublicKey,
    }
    return cryptoDetails
}

function logout() {
    // AUTH-5: Log a user out.
    authInstance.logout();
}
