import { toast as sonnerToast } from 'sonner'
import { ApiError } from './api-client'

type ToastVariant = 'default' | 'destructive'

interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
}

export function toast({ title, description, variant = 'default' }: ToastInput) {
  if (variant === 'destructive') {
    sonnerToast.error(title, { description })
    return
  }

  sonnerToast.success(title, { description })
}

/**
 * Standardized error handling for toasts.
 * Maps technical errors (ApiError, Error) to user-friendly messages.
 */
export function showErrorToast(error: unknown, title: string = 'Action Failed') {
  console.error('[Toast Error]:', error);

  let message = 'An unexpected error occurred. Please try again.';

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        message = error.message || 'Please check your input and try again.';
        break;
      case 401:
        message = 'Your session has expired. Please log in again.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource could not be found.';
        break;
      case 409:
        message = error.message || 'This action conflicts with existing data.';
        break;
      case 422:
        message = 'The data provided is invalid.';
        break;
      case 500:
        message = 'A server error occurred. Please try again later.';
        break;
      default:
        message = error.message || message;
    }
  } else if (error instanceof Error) {
    // If it's a generic error but not an ApiError, we show the message unless it's too technical
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  toast({
    title,
    description: message,
    variant: 'destructive',
  });
}
