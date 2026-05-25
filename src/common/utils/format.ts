export const formatCurrency = (value, locale = 'vi-VN', currency = 'VND') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)

export const formatDate = (value, locale = 'vi-VN') =>
  new Intl.DateTimeFormat(locale).format(new Date(value))
