export function pickNode(nodes) {
  const healthy = nodes.filter((n) => n.healthStatus !== 'down');
  if (healthy.length === 0) return null;
  healthy.sort((a, b) => a.priority - b.priority || b.weight - a.weight);
  return healthy[0];
}
