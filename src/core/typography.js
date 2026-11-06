export function frenchSpacing(text) {
  return text
    .replace(/[  ](?=[?!:;»])/g, ' ')
    .replace(/«[  ]/g, '« ')
    .replace(/^— /, '— ');
}
