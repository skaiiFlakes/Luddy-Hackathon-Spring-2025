export const getScoreColor = (score: number) => {
  if (score >= 85) return "bg-green-500"
  if (score >= 70) return "bg-yellow-500"
  return "bg-red-500"
}
