import { buildCorner, treatments } from "../src/core/corner";

for (let hundredths = 100; hundredths <= 300; hundredths++) {
  for (const treatment of treatments) {
    console.log(JSON.stringify(buildCorner({ beam: hundredths / 100, treatment })));
  }
}
