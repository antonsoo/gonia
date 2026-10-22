import { buildSpacing, spacingSystems } from "../src/core/spacing";

for (const system of spacingSystems)
  for (const columns of [4, 6, 8] as const)
    for (const basis of ["front", "diameter"] as const)
      for (const size of basis === "front" ? [6, 18, 36] : [0.5, 1, 2])
        for (const wideGap of system === "araeostyle" ? [3.25, 4, 6] : [4])
          for (const equalCentre of system === "eustyle" ? [false, true] : [false])
            console.log(
              JSON.stringify(
                buildSpacing({
                  system,
                  columns,
                  basis,
                  front: basis === "front" ? size : 18,
                  diameter: basis === "diameter" ? size : 1,
                  wideGap,
                  equalCentre,
                }),
              ),
            );
