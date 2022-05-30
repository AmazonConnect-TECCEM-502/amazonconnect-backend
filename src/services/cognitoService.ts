import AWS from "aws-sdk";
import crypto from "crypto";
import {
  COGNITO_APP_CLIENT_ID,
  COGNITO_APP_SECRET_HASH,
  AWS_REGION,
} from "../config";

type CognitoAttributes = "email";

class CognitoService {
  // Conectarse a Cognito
  private config: AWS.CognitoIdentityServiceProvider.ClientConfiguration;
  private cognitoIdentity: AWS.CognitoIdentityServiceProvider;

  // Conectar la aplicación a cognito
  private clientId = COGNITO_APP_CLIENT_ID;
  private secretHash = COGNITO_APP_SECRET_HASH;

  //Singleton
  private static instance: CognitoService;
  public static getInstance(): CognitoService {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new CognitoService();
    return this.instance;
  }

  private constructor() {
    this.config = {
      region: AWS_REGION,
    };
    this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider(this.config);
  }

  //Metodo de registro
  public async signUpUser(
    email: string,
    password: string,
    userAttr: { Name: CognitoAttributes; Value: string }[]
  ) {
    const params = {
      ClientId: this.clientId /* required */,
      Password: password /* required */,
      Username: email /* required */,
      SecretHash: this.hashSecret(email) /* required */,
      UserAttributes: userAttr,
    };

    return await this.cognitoIdentity.signUp(params).promise();
  }
  //Método de verificación de nuevos usuarios
  public async verifyUser(email: string, code: string) {
    const params = {
      ClientId: this.clientId,
      ConfirmationCode: code,
      Username: email,
      SecretHash: this.hashSecret(email) /* required */,
    };
    return await this.cognitoIdentity.confirmSignUp(params).promise();
  }

  //Autenticación de usuarios
  public async signInUser(email: string, password: string) {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.hashSecret(email),
      },
    };
    return await this.cognitoIdentity.initiateAuth(params).promise();
  }

  private hashSecret(username: string): string {
    return crypto
      .createHmac("SHA256", this.secretHash)
      .update(username + this.clientId)
      .digest("base64");
  }
}

export default CognitoService;
