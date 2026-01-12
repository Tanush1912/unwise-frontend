
export class ApiError extends Error {
    code: string
    details?: string
    status: number

    constructor(
        data: { error: string; code?: string; details?: string },
        status: number
    ) {
        super(data.error)
        this.name = 'ApiError'
        this.code = data.code || 'UNKNOWN'
        this.details = data.details
        this.status = status
    }

    isAuthError(): boolean {
        return this.status === 401 || this.code.startsWith('AUTH_')
    }

    isNotFound(): boolean {
        return this.status === 404 || this.code.startsWith('NOT_FOUND_')
    }

    isValidationError(): boolean {
        return this.status === 400 || this.code.startsWith('VALIDATION_')
    }

    isConflictError(): boolean {
        return this.status === 409 || this.code.startsWith('CONFLICT_')
    }

    isBusinessError(): boolean {
        return this.status === 422 || this.code.startsWith('BUSINESS_')
    }

    isExternalError(): boolean {
        return this.code.startsWith('EXTERNAL_')
    }

    isRetryable(): boolean {
        return (
            this.code.startsWith('EXTERNAL_') ||
            this.code === 'DATABASE_001' ||
            this.status === 503
        )
    }

    getDisplayMessage(): string {
        if (this.details) {
            return `${this.message} ${this.details}`
        }
        return this.message
    }
}

export interface ApiErrorResponse {
    error: string
    code?: string
    details?: string
}

export async function parseApiError(response: Response): Promise<ApiError> {
    try {
        const data: ApiErrorResponse = await response.json()
        return new ApiError(data, response.status)
    } catch {
        return new ApiError(
            {
                error: getDefaultErrorMessage(response.status),
                code: 'UNKNOWN'
            },
            response.status
        )
    }
}

function getDefaultErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.'
        case 401:
            return 'You need to be logged in to do this.'
        case 403:
            return 'You don\'t have permission to do this.'
        case 404:
            return 'The requested item was not found.'
        case 409:
            return 'This action conflicts with existing data.'
        case 422:
            return 'This action cannot be completed right now.'
        case 429:
            return 'Too many requests. Please try again later.'
        case 500:
            return 'Something went wrong on our end. Please try again.'
        case 502:
        case 503:
        case 504:
            return 'Service is temporarily unavailable. Please try again later.'
        default:
            return 'An unexpected error occurred.'
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
}

export const ErrorCodes = {
    AUTH_001: 'AUTH_001',
    AUTH_002: 'AUTH_002',
    AUTH_003: 'AUTH_003',
    AUTH_004: 'AUTH_004',
    AUTH_005: 'AUTH_005',
    
    VALIDATION_001: 'VALIDATION_001',
    VALIDATION_002: 'VALIDATION_002',
    VALIDATION_003: 'VALIDATION_003',
    VALIDATION_004: 'VALIDATION_004',
    VALIDATION_005: 'VALIDATION_005',
    VALIDATION_006: 'VALIDATION_006',
    VALIDATION_007: 'VALIDATION_007',

    NOT_FOUND_001: 'NOT_FOUND_001',
    NOT_FOUND_002: 'NOT_FOUND_002',
    NOT_FOUND_003: 'NOT_FOUND_003',
    NOT_FOUND_004: 'NOT_FOUND_004',
    NOT_FOUND_005: 'NOT_FOUND_005',

    CONFLICT_001: 'CONFLICT_001',
    CONFLICT_002: 'CONFLICT_002',
    CONFLICT_003: 'CONFLICT_003',
    CONFLICT_004: 'CONFLICT_004',
    CONFLICT_005: 'CONFLICT_005',

    BUSINESS_001: 'BUSINESS_001',
    BUSINESS_002: 'BUSINESS_002',
    BUSINESS_003: 'BUSINESS_003',
    BUSINESS_004: 'BUSINESS_004',
    BUSINESS_005: 'BUSINESS_005',

    EXTERNAL_001: 'EXTERNAL_001',
    EXTERNAL_002: 'EXTERNAL_002',
    EXTERNAL_003: 'EXTERNAL_003',

    DATABASE_001: 'DATABASE_001',
    INTERNAL_001: 'INTERNAL_001',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]
