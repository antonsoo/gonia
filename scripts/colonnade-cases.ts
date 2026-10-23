import { colonnadeModel } from "../src/core/colonnade";

for (const kind of ["double", "pseudo"] as const) {
  for (let gap = 1.5; gap <= 3; gap += 0.25) {
    console.log(JSON.stringify(colonnadeModel({ kind, gap })));
  }
}
