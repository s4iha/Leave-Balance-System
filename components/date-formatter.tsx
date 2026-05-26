'use client';

import { format as formatDate, formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface DateFormatterProps {
  date: string | Date;
  format: string;
}

export function DateFormatter({ date, format: dateFormat }: DateFormatterProps) {
  const [formatted, setFormatted] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        setFormatted('--');
      } else if (dateFormat === 'relative') {
        setFormatted(formatDistanceToNow(dateObj, { addSuffix: true }));
      } else {
        setFormatted(formatDate(dateObj, dateFormat));
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      setFormatted('--');
    }
    setIsMounted(true);
  }, [date, dateFormat]);

  if (!isMounted) {
    return <span>--</span>;
  }

  return <span>{formatted}</span>;
}
