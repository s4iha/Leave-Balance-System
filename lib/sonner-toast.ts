import { toast as sonnerToast } from 'sonner'

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
