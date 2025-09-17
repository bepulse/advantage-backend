import { IDocumentSignService } from '@/domain/external/document-sign.service';
import {
    ApiClient,
    EnvelopesApi,
    EnvelopeDefinition,
    Envelope as DSEnvelope,
} from 'docusign-esign';

type JwtCache = {
    accessToken: string | null;
    expiresAt: number; 
};

export class DocuSignService implements IDocumentSignService {
    private apiClient: ApiClient;
    private envelopesApi: EnvelopesApi;
    private jwt: JwtCache = { accessToken: null, expiresAt: 0 };

    constructor(
        private readonly baseUrl: string,
        private readonly integrationKey: string,
        private readonly authBasePath: string,
        private readonly userId: string,
        private readonly privateKey: string,
    ) {
        this.apiClient = new ApiClient();
        this.apiClient.setBasePath(baseUrl);
        this.envelopesApi = new EnvelopesApi(this.apiClient);
    }

    private async ensureAuth(): Promise<void> {
        const now = Date.now();

        if (this.jwt.accessToken && now < this.jwt.expiresAt - 60_000) return;

        await this.configureJWTAuth();
    }

    private async configureJWTAuth() {
        if (
            !this.integrationKey ||
            !this.userId ||
            !this.authBasePath ||
            !this.privateKey
        ) {
            throw new Error('DocuSign env vars missing (check integration key, user id, private key, auth base path).');
        }

        const privateKey = Buffer.from(this.privateKey, 'base64');

        this.apiClient.setOAuthBasePath(this.authBasePath);

        const jwtScopes = ['signature', 'impersonation'];
        const jwtLifeSec = 3600;

        const tokenResp = await this.apiClient.requestJWTUserToken(
            this.integrationKey,
            this.userId,
            jwtScopes,
            privateKey,
            jwtLifeSec,
        );

        const accessToken = tokenResp.body.access_token;
        const expiresIn = tokenResp.body.expires_in;

        this.apiClient.setBasePath(this.baseUrl);
        this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

        this.envelopesApi = new EnvelopesApi(this.apiClient);

        this.jwt.accessToken = accessToken;
        this.jwt.expiresAt = Date.now() + expiresIn * 1000;
    }

    async createEnvelope(envelopeData: EnvelopeDefinition): Promise<string> {
        await this.ensureAuth();

        const { DOCUSIGN_ACCOUNT_ID } = process.env;
        if (!DOCUSIGN_ACCOUNT_ID) throw new Error('DOCUSIGN_ACCOUNT_ID not set');

        const def: EnvelopeDefinition = {
            status: envelopeData.status ?? 'sent',
            ...envelopeData,
        };

        const result = await this.envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, {
            envelopeDefinition: def,
        });

        if (!result.envelopeId) {
            throw new Error('Failed to create envelope: envelopeId not returned');
        }

        return result.envelopeId;
    }

    async getEnvelopeStatus(envelopeId: string): Promise<DSEnvelope> {
        await this.ensureAuth();

        const { DOCUSIGN_ACCOUNT_ID } = process.env;
        if (!DOCUSIGN_ACCOUNT_ID) throw new Error('DOCUSIGN_ACCOUNT_ID not set');

        const env = await this.envelopesApi.getEnvelope(DOCUSIGN_ACCOUNT_ID, envelopeId);
        return env; // contém .status (e.g., "completed", "sent", "voided"), etc.
    }

    async downloadDocument(envelopeId: string, documentId: string): Promise<Buffer> {
        await this.ensureAuth();

        const { DOCUSIGN_ACCOUNT_ID } = process.env;
        if (!DOCUSIGN_ACCOUNT_ID) throw new Error('DOCUSIGN_ACCOUNT_ID not set');

        const fileBytes = (await this.envelopesApi.getDocument(
            DOCUSIGN_ACCOUNT_ID,
            envelopeId,
            documentId,
            null as any, // params opcionais
        )) as unknown as ArrayBuffer | Uint8Array | Buffer;

        if (Buffer.isBuffer(fileBytes)) return fileBytes;
        if (fileBytes instanceof ArrayBuffer) return Buffer.from(new Uint8Array(fileBytes));
        return Buffer.from(fileBytes as Uint8Array);
    }
}
