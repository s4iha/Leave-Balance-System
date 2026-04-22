'use client';

import { format as formatDate } from 'date-fns';
import { useEffect, useState } from 'react';

interface DateFormatterProps {
  date: string | Date;
  format: string;
}

export function DateFormatter({ date, format: dateFormat }: DateFormatterProps) {
  const [formatted, setFormatted] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setFormatted(formatDate(new Date(date), dateFormat));
    setIsMounted(true);
  }, [date, dateFormat]);

  if (!isMounted) {
    return <span>--</span>;
  }

  return <span>{formatted}</span>;
}
