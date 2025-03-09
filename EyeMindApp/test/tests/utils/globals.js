const elementAttributesToRemove = {
  // tagname: attribute to remove
  path: 'style',
  polyline: 'style',
  marker: 'id',
  div: 'data-overlay-id',
  tspan: 'x',
  tspan: 'y',
  rect: 'x',
  rect: 'y',
  g: 'transform',
  g: 'class',
  svg: 'class',
}

export { elementAttributesToRemove }
