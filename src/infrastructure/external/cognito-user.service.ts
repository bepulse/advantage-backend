import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export class CognitoUserService {
  private client: CognitoIdentityProviderClient;

  constructor(
    private readonly region: string,
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly userPoolId: string
  ) {
    this.client = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async createUser(email: string, password?: string): Promise<void> {
    const finalPassword = password || "Temp@1234";

    const attributes = [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "true" },
    ];

    try {
      await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: this.userPoolId,
          Username: email,
          TemporaryPassword: finalPassword,
          MessageAction: "SUPPRESS",
          UserAttributes: attributes,
        })
      );

      await this.client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: this.userPoolId,
          Username: email,
          Password: finalPassword,
          Permanent: true,
        })
      );
    } catch (error: any) {
      if (error.name === "UsernameExistsException") {
        await this.client.send(
          new AdminUpdateUserAttributesCommand({
            UserPoolId: this.userPoolId,
            Username: email,
            UserAttributes: attributes,
          })
        );

        await this.client.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: this.userPoolId,
            Username: email,
            Password: finalPassword,
            Permanent: true,
          })
        );
      } else {
        throw error;
      }
    }
  }

  async setUserPassword(email: string, password: string): Promise<void> {
    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );

    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email_verified", Value: "true" }
        ],
      })
    );
  }
}