'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isApiError, ErrorCodes } from '@/lib/api-error'

export function useApiErrorHandler() {
    const router = useRouter()

    return (error: unknown, options?: { silent?: boolean }) => {
        console.error('[API Error]', error)

        if (!isApiError(error)) {
            if (!options?.silent) {
                if (error instanceof Error) {
                    toast.error(error.message)
                } else {
                    toast.error('An unexpected error occurred')
                }
            }
            return
        }

        switch (error.code) {
            case ErrorCodes.AUTH_001:
            case ErrorCodes.AUTH_002:
            case ErrorCodes.AUTH_003:
                if (!options?.silent) {
                    toast.error('Your session has expired. Please log in again.')
                }
                router.push('/login')
                return

            case ErrorCodes.AUTH_005:
                if (!options?.silent) {
                    toast.error(error.message)
                }
                router.push('/groups')
                return

            case ErrorCodes.NOT_FOUND_003:
                if (!options?.silent) {
                    toast.error('This group no longer exists')
                }
                router.push('/groups')
                return

            case ErrorCodes.NOT_FOUND_004:
                if (!options?.silent) {
                    toast.error('This expense no longer exists')
                }
                router.back()
                return

            case ErrorCodes.BUSINESS_002:
            case ErrorCodes.BUSINESS_003:
            case ErrorCodes.BUSINESS_004:
                if (!options?.silent) {
                    toast.error(error.message, {
                        description: error.details,
                        duration: 5000,
                    })
                }
                return

            case ErrorCodes.CONFLICT_003:
            case ErrorCodes.CONFLICT_004:
                if (!options?.silent) {
                    toast.info(error.message)
                }
                return

            case ErrorCodes.CONFLICT_005:
                if (!options?.silent) {
                    toast.warning(error.message)
                }
                return

            case ErrorCodes.EXTERNAL_003:
                if (!options?.silent) {
                    toast.error('AI service is temporarily unavailable', {
                        description: 'Please try again in a moment',
                        action: {
                            label: 'Retry',
                            onClick: () => window.location.reload(),
                        },
                        duration: 8000,
                    })
                }
                return

            case ErrorCodes.VALIDATION_001:
            case ErrorCodes.VALIDATION_002:
            case ErrorCodes.VALIDATION_003:
            case ErrorCodes.VALIDATION_004:
            case ErrorCodes.VALIDATION_005:
            case ErrorCodes.VALIDATION_006:
                if (!options?.silent) {
                    toast.error(error.message)
                }
                return
        }

        if (error.status === 401) {
            if (!options?.silent) {
                toast.error('Please log in to continue')
            }
            router.push('/login')
            return
        }

        if (error.status === 403) {
            if (!options?.silent) {
                toast.error("You don't have permission to do this")
            }
            return
        }

        if (error.status === 404) {
            if (!options?.silent) {
                toast.error(error.message || 'Not found')
            }
            return
        }

        if (error.status === 409) {
            if (!options?.silent) {
                toast.info(error.message || 'This already exists')
            }
            return
        }

        if (error.status === 422) {
            if (!options?.silent) {
                toast.error(error.message, {
                    description: error.details,
                })
            }
            return
        }

        if (error.status >= 500) {
            if (!options?.silent) {
                if (error.isRetryable()) {
                    toast.error('Something went wrong. Please try again.', {
                        action: {
                            label: 'Retry',
                            onClick: () => window.location.reload(),
                        },
                    })
                } else {
                    toast.error('Something went wrong on our end')
                }
            }
            return
        }

        if (!options?.silent) {
            toast.error(error.message)
        }
    }
}

export function handleApiError(error: unknown): void {
    console.error('[API Error]', error)

    if (!isApiError(error)) {
        if (error instanceof Error) {
            toast.error(error.message)
        } else {
            toast.error('An unexpected error occurred')
        }
        return
    }

    if (error.details) {
        toast.error(error.message, { description: error.details })
    } else {
        toast.error(error.message)
    }
}
