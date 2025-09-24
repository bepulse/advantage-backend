import { IDocumentSignService } from '@/domain/external/document-sign.service';
import {
    ApiClient,
    EnvelopesApi,
    EnvelopeDefinition,
    Envelope as DSEnvelope,
    RecipientViewRequest,
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
        if (this.isTokenValid()) {
            return;
        }

        console.log('Token expirado ou inválido, renovando...');
        await this.configureJWTAuth();
    }

    private isTokenValid(): boolean {
        const now = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutos de buffer

        return !!(
            this.jwt.accessToken && 
            this.jwt.expiresAt > 0 && 
            now < (this.jwt.expiresAt - bufferTime)
        );
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 1): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await this.ensureAuth();
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                // Verificar se é erro de token expirado
                const isTokenError = this.isTokenExpiredError(error);
                
                if (isTokenError && attempt < maxRetries) {
                    console.log(`Tentativa ${attempt + 1} falhou com token expirado, forçando renovação...`);
                    
                    // Forçar renovação do token
                    this.jwt.accessToken = null;
                    this.jwt.expiresAt = 0;
                    
                    // Aguardar um pouco antes de tentar novamente
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                
                // Se não é erro de token ou já esgotou as tentativas, relançar o erro
                throw error;
            }
        }

        throw lastError!;
    }

    private isTokenExpiredError(error: any): boolean {
        if (!error) return false;
        
        const errorMessage = error.message || error.toString() || '';
        const errorName = error.name || '';
        
        return (
            errorName === 'JwtExpiredError' ||
            errorMessage.includes('Token expired') ||
            errorMessage.includes('token_expired') ||
            errorMessage.includes('invalid_token') ||
            errorMessage.includes('unauthorized') ||
            (error.response && error.response.status === 401)
        );
    }

    private async configureJWTAuth() {
        try {
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
            const jwtLifeSec = 3600; // 1 hora

            console.log('Solicitando novo token JWT do DocuSign...');
            
            const tokenResp = await this.apiClient.requestJWTUserToken(
                this.integrationKey,
                this.userId,
                jwtScopes,
                privateKey,
                jwtLifeSec,
            );

            const accessToken = tokenResp.body.access_token;
            const expiresIn = tokenResp.body.expires_in;

            if (!accessToken) {
                throw new Error('Falha ao obter access token do DocuSign');
            }

            this.apiClient.setBasePath(this.baseUrl);
            this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

            this.envelopesApi = new EnvelopesApi(this.apiClient);

            this.jwt.accessToken = accessToken;
            this.jwt.expiresAt = Date.now() + (expiresIn * 1000);

            console.log(`Token JWT renovado com sucesso. Expira em: ${new Date(this.jwt.expiresAt).toISOString()}`);
            
        } catch (error) {
            console.error('Erro ao configurar autenticação JWT:', error);
            
            // Limpar cache em caso de erro
            this.jwt.accessToken = null;
            this.jwt.expiresAt = 0;
            
            throw new Error(`Falha na autenticação DocuSign: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    async createEnvelope(envelopeData: EnvelopeDefinition): Promise<string> {
        return this.executeWithRetry(async () => {
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
        });
    }

    async getEnvelopeStatus(envelopeId: string): Promise<DSEnvelope> {
        return this.executeWithRetry(async () => {
            const { DOCUSIGN_ACCOUNT_ID } = process.env;
            if (!DOCUSIGN_ACCOUNT_ID) throw new Error('DOCUSIGN_ACCOUNT_ID not set');

            const env = await this.envelopesApi.getEnvelope(DOCUSIGN_ACCOUNT_ID, envelopeId);
            return env; // contém .status (e.g., "completed", "sent", "voided"), etc.
        });
    }

    async downloadDocument(envelopeId: string, documentId: string): Promise<Buffer> {
        return this.executeWithRetry(async () => {
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
        });
    }

    async createRecipientView(envelopeId: string, recipientEmail: string, recipientName: string, returnUrl: string): Promise<string> {
        return this.executeWithRetry(async () => {
            const { DOCUSIGN_ACCOUNT_ID } = process.env;
            if (!DOCUSIGN_ACCOUNT_ID) throw new Error('DOCUSIGN_ACCOUNT_ID not set');

            const recipientViewRequest: RecipientViewRequest = {
                authenticationMethod: 'none',
                email: recipientEmail,
                userName: recipientName,
                returnUrl: returnUrl,
                clientUserId: recipientEmail,
            };

            const result = await this.envelopesApi.createRecipientView(
                DOCUSIGN_ACCOUNT_ID,
                envelopeId,
                { recipientViewRequest }
            );

            if (!result.url) {
                throw new Error('Failed to create recipient view: URL not returned');
            }

            return result.url;
        });
    }
}
