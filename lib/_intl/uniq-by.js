
export default function(iteratee, array) {
  const set = new Set()
  return array.reduce((result, item) => {
    const subject = iteratee(item)
    if (!set.has(subject)) {
      set.add(subject)
      result.push(item)
    }
    return result
  }, [])
}