export const ago = (days, hours = 0) => Date.now() - days * 86400000 - hours * 3600000
export const ahead = (days) => {
  const date = new Date()
  date.setHours(9, 0, 0, 0)
  return date.getTime() + days * 86400000
}

export const toDateInput = (timestamp) => new Date(timestamp).toLocaleDateString('en-CA')
export const fromDateInput = (value) => new Date(`${value}T09:00:00`).getTime()
